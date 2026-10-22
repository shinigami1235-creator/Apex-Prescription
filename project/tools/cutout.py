import json, os, sys, numpy as np
from PIL import Image
from rembg import remove, new_session
P=json.load(open("/home/claude/apexsx/data/products.json"))
d="/home/claude/apexsx/src/images"
out="/home/claude/apexsx/cutouts"
sess=new_session("isnet-general-use")
for p in P:
    src=os.path.join(d,p["main_image"])
    im=Image.open(src).convert("RGBA")
    rawp=os.path.join(out,"raw_"+p["slug"]+".png")
    if os.path.exists(rawp): cut=Image.open(rawp)
    else:
        cut=remove(im, session=sess, post_process_mask=True); cut.save(rawp)
    a=np.array(cut)[:,:,3]
    ys,xs=np.nonzero(a>128)
    pts=np.stack([xs,ys],1).astype(float); pts-=pts.mean(0)
    cov=np.cov(pts.T); w,v=np.linalg.eigh(cov); ax=v[:,np.argmax(w)]
    ang=np.degrees(np.arctan2(ax[0],ax[1]))  # angle from vertical
    if ang>90: ang-=180
    if ang<-90: ang+=180
    elong=np.sqrt(w.max()/w.min())
    rot = 0.0
    if p["slug"]!="gluta-o" and elong>1.6 and 3<abs(ang)<60: rot=-ang
    if rot: cut=cut.rotate(rot, resample=Image.BICUBIC, expand=True)
    bb=cut.getchannel("A").point(lambda x:255 if x>8 else 0).getbbox(); cut=cut.crop(bb)
    cut.save(os.path.join(out,p["slug"]+".png"))
    print(p["slug"], "angle", round(ang,1), "elong", round(elong,2), "rot", round(rot,1), cut.size)
