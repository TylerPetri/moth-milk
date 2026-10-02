#!/usr/bin/env python3
"""Recover an original Stripe sandbox event through a local signed webhook.

Only fetches an existing event from Stripe; never creates a payment or edits an
order. Credentials are read from the environment and never printed. Local
operator tool: do not expose this script as a public application endpoint.
"""
import argparse
import base64
import hashlib
import hmac
import json
import os
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class ReplayConnectionError(Exception):
    pass


def connection_detail(error):
    reason = error.reason if isinstance(error, urllib.error.URLError) else error
    if isinstance(reason, ssl.SSLCertVerificationError):
        return 'TLS certificate verification failed: Python cannot verify the server certificate. Check the Python certificate installation; do not disable verification.'
    if isinstance(reason, ssl.SSLError):
        return 'TLS handshake failed. Check Python certificates and network TLS settings.'
    if isinstance(reason, ConnectionRefusedError):
        return 'Connection refused. Check that the service is running on the selected port.'
    if isinstance(reason, socket.gaierror):
        return 'DNS lookup failed. Check the network connection and DNS settings.'
    if isinstance(reason, TimeoutError):
        return 'Connection timed out. Check the network connection and service availability.'
    if isinstance(reason, OSError):
        return f'Network error ({type(reason).__name__}, errno={reason.errno}).'
    return 'Network connection failed. Check proxy, firewall and service availability.'


def read_response(opener, request, stage, limit):
    try:
        with opener.open(request, timeout=20) as response:
            return response.status, response.read(limit)
    except urllib.error.HTTPError as error:
        if stage == 'Stripe event fetch':
            hint = {401: 'Check STRIPE_TEST_SECRET_KEY.', 403: 'Check the API key permissions.',
                    404: 'Check the event ID and that the test key belongs to its Stripe account/sandbox.'}.get(error.code, 'Check Stripe availability and event access.')
        else:
            hint = {400: 'Check the webhook signing secret, endpoint and backend logs.',
                    404: 'Check that the corrected webhook route is deployed.',
                    503: 'Check payment storage and backend logs; retry the same event.'}.get(error.code, 'Check backend logs.')
        raise ReplayConnectionError(f'{stage}: HTTP {error.code}. {hint}') from None
    except (urllib.error.URLError, OSError) as error:
        raise ReplayConnectionError(f'{stage}: {connection_detail(error)}') from None


def validate_target(url):
    target = urllib.parse.urlsplit(url)
    if (target.scheme != 'http' or target.hostname not in {'localhost', '127.0.0.1', '::1'}
            or target.path != '/v1/webhooks/stripe/test' or target.query or target.fragment
            or target.username or target.password):
        raise ValueError('Target must be a local HTTP /v1/webhooks/stripe/test endpoint')
    return url


def validate_event(payload, event_id, expected_order=None):
    event = json.loads(payload)
    if event.get('id') != event_id or event.get('object') != 'event' or event.get('livemode') is not False:
        raise ValueError('Expected the original sandbox event; live events are refused')
    if event.get('type') not in {'payment_intent.succeeded', 'payment_intent.payment_failed'} or event.get('account'):
        raise ValueError('Only platform PaymentIntent outcome events are supported')
    intent = event.get('data', {}).get('object', {})
    metadata = intent.get('metadata', {})
    if intent.get('object') != 'payment_intent' or intent.get('livemode') is not False or metadata.get('payment_environment') != 'test':
        raise ValueError('Payment must belong to a separated test checkout')
    order = metadata.get('order_id', '')
    if not uuid.UUID(order).int:
        raise ValueError('Order binding is missing')
    if expected_order and order != expected_order:
        raise ValueError('Event does not belong to the requested order')
    if event['type'] == 'payment_intent.succeeded' and intent.get('status') != 'succeeded':
        raise ValueError('Success event does not contain a succeeded PaymentIntent')
    return order


def signature(payload, secret, timestamp):
    digest = hmac.new(secret.encode(), str(timestamp).encode() + b'.' + payload, hashlib.sha256).hexdigest()
    return f't={timestamp},v1={digest}'


def replay(event_id, target, expected_order=None):
    if not re.fullmatch(r'evt_[A-Za-z0-9_]+', event_id):
        raise ValueError('Use the original evt_ ID from Stripe, not a pi_ ID')
    validate_target(target)
    api_key = os.environ.get('STRIPE_TEST_SECRET_KEY', '').strip()
    secret = os.environ.get('STRIPE_TEST_WEBHOOK_SECRET', '').strip()
    if not api_key.startswith('sk_test_') or len(api_key) < 20 or not secret.startswith('whsec_') or len(secret) < 15:
        raise ValueError('Set STRIPE_TEST_SECRET_KEY and the running backend’s STRIPE_TEST_WEBHOOK_SECRET')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirects())
    auth = base64.b64encode((api_key + ':').encode()).decode()
    request = urllib.request.Request('https://api.stripe.com/v1/events/' + event_id,
                                     headers={'Authorization': 'Basic ' + auth})
    _, payload = read_response(opener, request, 'Stripe event fetch', 1_048_577)
    if len(payload) > 1_048_576:
        raise ValueError('Event exceeds webhook body limit')
    order = validate_event(payload, event_id, expected_order)
    request = urllib.request.Request(target, data=payload, method='POST', headers={
        'Content-Type': 'application/json',
        'Stripe-Signature': signature(payload, secret, int(time.time()))})
    status, body = read_response(opener, request, 'Local backend webhook', 4096)
    result = json.loads(body)
    if status != 200 or result.get('received') is not True:
        raise ValueError('Backend did not acknowledge the event; keep the original checkout')
    print(f'Original event accepted for order {order}. Check the saved checkout for confirmation.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('event_id')
    parser.add_argument('--url', default='http://localhost:8080/v1/webhooks/stripe/test')
    parser.add_argument('--order-id', help='Optionally require the event to match this saved order')
    args = parser.parse_args()
    try:
        replay(args.event_id, args.url, args.order_id)
        return 0
    except ReplayConnectionError as err:
        print('Replay failed: ' + str(err), file=sys.stderr)
    except (ValueError, KeyError, TypeError, urllib.error.URLError, TimeoutError) as err:
        message = str(err) if isinstance(err, ValueError) else 'Cannot verify the event or reach the service'
        print('Replay failed: ' + message, file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
