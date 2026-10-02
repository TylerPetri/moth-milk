import importlib.util
import json
import io
from unittest.mock import patch, MagicMock
from contextlib import redirect_stdout
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('replay', Path(__file__).with_name('replay-stripe-test-event.py'))
replay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(replay)

class ReplayTests(unittest.TestCase):
    def fixture(self):
        return {'object':'event','id':'evt_original','livemode':False,'type':'payment_intent.succeeded','data':{'object':{'object':'payment_intent','livemode':False,'status':'succeeded','metadata':{'order_id':'33333333-3333-4333-8333-333333333333','payment_environment':'test'}}}}
    def test_local_target_only(self):
        for url in ['https://example.com/v1/webhooks/stripe/test','http://localhost/v1/webhooks/stripe/live','http://localhost/v1/webhooks/stripe','http://user:pass@localhost/v1/webhooks/stripe/test']:
            with self.subTest(url=url), self.assertRaises(ValueError): replay.validate_target(url)
        replay.validate_target('http://localhost:8080/v1/webhooks/stripe/test')
    def test_original_event(self):
        self.assertEqual(replay.validate_event(json.dumps(self.fixture()),'evt_original'),'33333333-3333-4333-8333-333333333333')
    def test_binding_rejections(self):
        for kind in ['live','wrong-event','wrong-order','legacy','connected','not-succeeded']:
            with self.subTest(kind=kind):
                event=self.fixture(); event_id='evt_original'; order=None
                if kind=='live': event['livemode']=True
                if kind=='wrong-event': event_id='evt_other'
                if kind=='wrong-order': order='44444444-4444-4444-8444-444444444444'
                if kind=='legacy': event['data']['object']['metadata']['payment_environment']='legacy'
                if kind=='connected': event['account']='acct_connected'
                if kind=='not-succeeded': event['data']['object']['status']='processing'
                with self.assertRaises(ValueError):replay.validate_event(json.dumps(event),event_id,order)
    def test_signature(self):
        self.assertEqual(replay.signature(b'payload','secret',123),'t=123,v1=5f44b12a081f18a8af8e23250aa237dd353831cbce52631c3af7cc68ce8c6ec4')

    def test_replay_uses_original_payload_and_signature_without_exposing_secrets(self):
        payload = json.dumps(self.fixture(), indent=2).encode()
        provider, backend = MagicMock(), MagicMock()
        provider.__enter__.return_value = provider
        backend.__enter__.return_value = backend
        provider.read.return_value = payload
        backend.status = 200
        backend.read.return_value = b'{"received":true}'
        opener = MagicMock()
        opener.open.side_effect = [provider, backend]
        env = {'STRIPE_TEST_SECRET_KEY':'sk_test_private_api_key', 'STRIPE_TEST_WEBHOOK_SECRET':'whsec_private_local_secret'}
        output = io.StringIO()
        with patch.dict('os.environ', env), patch.object(replay.urllib.request, 'build_opener', return_value=opener), patch.object(replay.time, 'time', return_value=123), redirect_stdout(output):
            replay.replay('evt_original','http://localhost:8080/v1/webhooks/stripe/test')
        posted = opener.open.call_args_list[1].args[0]
        self.assertEqual(posted.data, payload)
        self.assertEqual(posted.get_header('Stripe-signature'), replay.signature(payload, env['STRIPE_TEST_WEBHOOK_SECRET'],123))
        self.assertNotIn('private', output.getvalue())


    def test_connection_diagnostics_identify_stage_without_raw_error_details(self):
        import ssl
        import socket
        import urllib.error
        cases = [
            (ssl.SSLCertVerificationError(1, 'PRIVATE server detail'), 'certificate verification'),
            (ConnectionRefusedError(111, 'PRIVATE server detail'), 'Connection refused'),
            (socket.gaierror(-2, 'PRIVATE server detail'), 'DNS lookup'),
            (TimeoutError('PRIVATE server detail'), 'timed out'),
        ]
        for error, expected in cases:
            with self.subTest(expected=expected):
                opener = MagicMock()
                opener.open.side_effect = urllib.error.URLError(error)
                with self.assertRaises(replay.ReplayConnectionError) as caught:
                    replay.read_response(opener, None, 'Stripe event fetch', 100)
                self.assertIn('Stripe event fetch', str(caught.exception))
                self.assertIn(expected, str(caught.exception))
                self.assertNotIn('PRIVATE', str(caught.exception))

    def test_http_diagnostics_distinguish_provider_and_backend(self):
        import urllib.error
        for stage, code, expected in [('Stripe event fetch',404,'account/sandbox'),('Local backend webhook',400,'signing secret')]:
            opener=MagicMock()
            opener.open.side_effect=urllib.error.HTTPError('https://private',code,'PRIVATE',{},None)
            with self.assertRaises(replay.ReplayConnectionError) as caught:
                replay.read_response(opener,None,stage,100)
            self.assertIn(stage,str(caught.exception))
            self.assertIn(expected,str(caught.exception))
            self.assertNotIn('PRIVATE',str(caught.exception))

if __name__=='__main__': unittest.main()
