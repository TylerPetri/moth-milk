"""Bake each library story into six complete, photographed sofa-book positions.

Run from the project root: python3 scripts/generate_sofa_books.py
Requires Pillow, numpy, fonttools, and npm-installed Fontsource files.
The approved and blank book templates are kept in static/images for reproducibility.
"""
from pathlib import Path
import re
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
IMAGES=ROOT/'static/images'
SOURCES=ROOT/'assets/source/sofa-books'
OUTPUT=IMAGES/'sofa-books'
OUTPUT.mkdir(exist_ok=True)
W,H=600,800

# Coordinates in the approved blank templates. Both silhouette and front-board
# quadrilaterals are traced from the photographed book, never a floating box.
POSITIONS={
 'desktop':[
  {'body':[(241,403),(257,393),(551,344),(755,574),(757,627),(405,680),(374,669),(344,624)],'face':[(284,402),(549,349),(747,574),(406,634)]},
  {'body':[(782,366),(803,353),(1094,322),(1237,563),(1239,610),(893,644),(854,628),(830,573)],'face':[(820,356),(1091,326),(1230,563),(902,598)]},
  {'body':[(1224,368),(1242,356),(1550,322),(1718,541),(1718,590),(1360,625),(1320,592),(1295,534)],'face':[(1263,368),(1547,325),(1712,540),(1363,574)]},
 ],
 'mobile':[
  {'body':[(285,972),(299,960),(464,941),(535,1081),(535,1109),(361,1138),(333,1128),(314,1089)],'face':[(307,970),(462,946),(530,1078),(357,1111)]},
  {'body':[(505,947),(519,935),(671,918),(768,1066),(769,1094),(564,1125),(545,1110),(525,1072)],'face':[(533,944),(668,921),(764,1063),(562,1092)]},
  {'body':[(726,930),(741,918),(867,900),(990,1030),(990,1060),(824,1084),(800,1074),(773,1043)],'face':[(750,928),(866,903),(985,1030),(817,1055)]},
 ]
}

def font(size):
 target=ROOT/'scripts/cormorant-garamond-600.ttf'
 if not target.exists():
  source=ROOT/'node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff'
  f=TTFont(source);f.flavor=None;f.save(target)
 return ImageFont.truetype(str(target),size)

def cover_texture(art,cloth,title,accent):
 base=ImageEnhance.Brightness(cloth.convert('RGB').resize((W,H),Image.Resampling.LANCZOS)).enhance(.48)
 art=ImageEnhance.Brightness(ImageEnhance.Color(art.convert('RGB')).enhance(.8)).enhance(1.1)
 scale=max(W/art.width,H/art.height)
 picture=art.resize((round(art.width*scale),round(art.height*scale)),Image.Resampling.LANCZOS)
 picture=picture.crop(((picture.width-W)//2,(picture.height-H)//2,(picture.width+W)//2,(picture.height+H)//2))
 # Story art is printed across the entire physical board, with cloth grain in
 # the ink. Its only boundary is the photographed book edge.
 cover=Image.blend(base,picture,.81)
 vignette=Image.new('L',(W,H));vp=vignette.load()
 for y in range(H):
  for x in range(W):
   edge=min(x,W-1-x,y,H-1-y)
   vp[x,y]=round(95*(1-min(1,edge/105)))
 cover=Image.composite(Image.new('RGB',(W,H),'#100b0b'),cover,vignette)
 # Soft ink glaze lets long titles read without a framed rectangular label.
 shade=Image.new('L',(W,H));p=shade.load()
 for y in range(360,615):
  fade=max(0,1-abs(y-490)/130)
  for x in range(55,545):p[x,y]=round(178*fade*min(1,(x-55)/50,(544-x)/50))
 cover=Image.composite(Image.new('RGB',(W,H),'#120c0b'),cover,shade)
 ink=Image.new('RGBA',(W,H));d=ImageDraw.Draw(ink)
 def line(text,y,face,color):
  box=d.textbbox((0,0),text,font=face)
  x=(W-(box[2]-box[0]))/2
  d.text((x+1,y+2),text,font=face,fill='#090708')
  d.text((x,y),text,font=face,fill=color)
 line('M O T H   M I L K',69,font(31),'#c9ae86')
 face=font(104);words=title.upper().split();lines=[];current=''
 for word in words:
  trial=f'{current} {word}'.strip()
  if current and d.textlength(trial,font=face)>470:lines.append(current);current=word
  else:current=trial
 if current:lines.append(current)
 while any(d.textlength(s,font=face)>470 for s in lines):face=font(face.size-3)
 height=face.size*.83
 for i,s in enumerate(lines):line(s,475-(len(lines)-1)*height/2+i*height,face,'#f0ddba')
 line('A F T E R   H O U R S',700,font(27),'#c9ae86')
 return Image.alpha_composite(cover.convert('RGBA'),ink).convert('RGB')

def coefficients(corners):
 source=[(0,0),(W,0),(W,H),(0,H)];rows=[];values=[]
 for (x,y),(u,v) in zip(corners,source):
  rows.append([x,y,1,0,0,0,-u*x,-u*y]);values.append(u)
  rows.append([0,0,0,x,y,1,-v*x,-v*y]);values.append(v)
 return tuple(np.linalg.solve(np.array(rows,float),np.array(values,float)))

def book_position(scene,template,position,cover,accent):
 shape=position['body'];face=position['face'];left=min(x for x,y in shape)-25;top=min(y for x,y in shape)-25
 right=max(x for x,y in shape)+25;bottom=max(y for x,y in shape)+25
 rect=(left,top,right,bottom);w=right-left;h=bottom-top
 local_shape=[(x-left,y-top) for x,y in shape]
 local_face=[(x-left,y-top) for x,y in face]
 base=template.crop(rect).convert('RGBA')
 # A small story-specific tint is applied to the entire physical binding,
 # including the board's sides and back edge. The photographed pages remain.
 color=tuple(int(accent[n:n+2],16) for n in (1,3,5))
 tint=ImageOps.colorize(ImageOps.grayscale(base.convert('RGB')),
                        black=(7,5,5),white=tuple(round(channel*.75+35) for channel in color)).convert('RGBA')
 body_mask=Image.new('L',base.size);ImageDraw.Draw(body_mask).polygon(local_shape,fill=24)
 base=Image.composite(tint,base,body_mask)
 # The exposed cloth spine and back-board lip share this story's binding dye.
 spine=[local_shape[0],local_face[0],local_face[3],local_shape[-2],local_shape[-1]]
 spine_mask=Image.new('L',base.size);ImageDraw.Draw(spine_mask).polygon(spine,fill=110)
 base=Image.composite(tint,base,spine_mask.filter(ImageFilter.GaussianBlur(.8)))
 face_mask=Image.new('L',base.size);ImageDraw.Draw(face_mask).polygon(local_face,fill=255)
 face_mask=face_mask.filter(ImageFilter.GaussianBlur(1.35))
 printed=cover.transform(base.size,Image.Transform.PERSPECTIVE,coefficients(local_face),Image.Resampling.BICUBIC)
 base=Image.composite(printed.convert('RGBA'),base,face_mask)
 silhouette=Image.new('L',base.size);ImageDraw.Draw(silhouette).polygon(local_shape,fill=255)
 silhouette=silhouette.filter(ImageFilter.GaussianBlur(1.35))
 # Contact shade remains underneath the page block, not a glow around the cover.
 shadow=Image.new('L',base.size);ImageDraw.Draw(shadow).polygon([(x+1,y+6) for x,y in local_shape],fill=120)
 shadow=shadow.filter(ImageFilter.GaussianBlur(8))
 output=Image.new('RGBA',base.size,(20,4,5,0))
 output.putalpha(shadow)
 base.putalpha(silhouette)
 output.alpha_composite(base)
 if scene=='desktop':
  # The desktop reference is a close crop of the 1670x942 room photograph.
  out_width=round(w*780/template.width);out_height=round(h*300/template.height)
  output=output.resize((out_width,out_height),Image.Resampling.LANCZOS)
  x=round(440+left*780/template.width);y=round(505+top*300/template.height)
 else:x=left;y=top
 return output,(x,y)

def approved_position(scene,reference,position):
 shape=position['body'];left=min(x for x,y in shape)-25;top=min(y for x,y in shape)-25
 right=max(x for x,y in shape)+25;bottom=max(y for x,y in shape)+25
 part=reference.crop((left,top,right,bottom)).convert('RGBA')
 local=[(x-left,y-top) for x,y in shape]
 silhouette=Image.new('L',part.size);ImageDraw.Draw(silhouette).polygon(local,fill=255)
 shadow=Image.new('L',part.size);ImageDraw.Draw(shadow).polygon([(x+1,y+6) for x,y in local],fill=120)
 output=Image.new('RGBA',part.size,(20,4,5,0))
 output.putalpha(shadow.filter(ImageFilter.GaussianBlur(8)))
 part.putalpha(silhouette.filter(ImageFilter.GaussianBlur(1.35)))
 output.alpha_composite(part)
 if scene=='desktop':
  width=round(output.width*780/reference.width);height=round(output.height*300/reference.height)
  output=output.resize((width,height),Image.Resampling.LANCZOS)
 return output

def write_webp(image,path,quality=93):
 temporary=path.with_suffix('.temporary')
 for _ in range(5):
  image.save(temporary,'WEBP',quality=quality,method=5)
  try:
   with Image.open(temporary) as saved:saved.verify()
   temporary.replace(path);return
  except OSError:temporary.unlink(missing_ok=True)
 raise RuntimeError(f'Could not encode {path}')

def main():
 entries=re.findall(r"slug: '([^']+)', title: '([^']+)'",(ROOT/'src/lib/data/library.js').read_text())
 accents=re.findall(r"cover: \{ position: [^,]+, accent: '(#[0-9a-fA-F]+)'",(ROOT/'src/lib/data/library.js').read_text())
 assert len(entries)==len(accents)==22
 cloth=Image.open(IMAGES/'sofa-book-cloth.png')
 templates={scene:Image.open(SOURCES/f'sofa-book-template-{scene}.png').convert('RGB') for scene in POSITIONS}
 for index,((slug,title),accent) in enumerate(zip(entries,accents)):
  atlas=Image.open(IMAGES/f'sofa-cover-atlas-{index//6+1}.png').convert('RGB')
  col=index%3;row=(index%6)//3;aw=atlas.width//3;ah=atlas.height//2
  art=atlas.crop((col*aw,row*ah,(col+1)*aw,(row+1)*ah))
  cover=cover_texture(art,cloth,title,accent)
  write_webp(cover,OUTPUT/f'{slug}-cover.webp',90)
  for scene,positions in POSITIONS.items():
   for index_position,position in enumerate(positions,1):
    complete,(x,y)=book_position(scene,templates[scene],position,cover,accent)
    # Assets keep their own absolute anchor in a generated manifest.
    write_webp(complete,OUTPUT/f'{slug}-{scene}-{index_position}.webp')
  print(slug)
 # A tiny JS manifest lets the canvas render complete cutouts without geometry.
 import json
 manifest={scene:[] for scene in POSITIONS}
 for scene,positions in POSITIONS.items():
  for position in positions:
   sample,xy=book_position(scene,templates[scene],position,Image.new('RGB',(W,H)), '#000000')
   manifest[scene].append([*xy,*sample.size])
 # The initial three books retain the user's approved photographed finish.
 for scene,positions in POSITIONS.items():
  approved=Image.open(SOURCES/f'sofa-books-approved-{scene}.png').convert('RGB')
  for slot,slug in enumerate(('static','hush','underbed'),1):
   cutout=approved_position(scene,approved,positions[slot-1])
   write_webp(cutout,OUTPUT/f'{slug}-{scene}-{slot}.webp')
 (ROOT/'src/lib/data/sofa-positions.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 print(f'Baked {len(entries)*6} whole-book position assets and {len(entries)} covers.')

if __name__=='__main__':main()
