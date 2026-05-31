#!/usr/bin/env python3
"""Generate all conceptual diagrams for COMP27112 Ch6 as standalone SVG assets."""
import os, html

OUT = os.path.join(os.path.dirname(__file__), "assets", "diagrams")
os.makedirs(OUT, exist_ok=True)

# ---- palette (works on dark card) ----
INK   = "#0f1015"
PANEL = "#171922"
PANEL2= "#1d2030"
LINE  = "#e9e7df"
MUT   = "#8a90a0"
PUR   = "#9a72e6"   # manchester-ish purple, brightened
YEL   = "#f4c95d"   # signal yellow
NEG   = "#ff8278"   # negative coral
POS   = "#5cd1e6"   # positive cyan
ZER   = "#5b6072"   # zero grey
GRID  = "#2a2e3d"

FONT  = "'JetBrains Mono','SFMono-Regular',ui-monospace,monospace"

def svg_open(w, h, vb=None):
    vb = vb or f"0 0 {w} {h}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" '
            f'width="{w}" height="{h}" font-family="{FONT}">')

def panel(w, h, r=14):
    return (f'<rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" rx="{r}" '
            f'fill="{PANEL}" stroke="{GRID}"/>')

def save(name, body):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(body)
    print("wrote", name)

# ---------- generic kernel grid ----------
def kernel_grid(vals, cell=58, pad=18, title=None, color_signed=True,
                circle_idx=None, shade=None, val_fmt=str):
    rows = len(vals); cols = len(vals[0])
    top = pad + (26 if title else 0)
    w = pad*2 + cols*cell
    h = top + rows*cell + pad
    s = [svg_open(w, h), panel(w, h)]
    if title:
        s.append(f'<text x="{w/2}" y="{pad+16}" fill="{LINE}" font-size="15" '
                 f'text-anchor="middle" font-weight="700">{html.escape(title)}</text>')
    for r in range(rows):
        for c in range(cols):
            x = pad + c*cell; y = top + r*cell
            v = vals[r][c]
            fill = PANEL2
            if shade and shade[r][c] is not None:
                fill = shade[r][c]
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" '
                     f'fill="{fill}" stroke="{GRID}" stroke-width="1.5"/>')
            txt = val_fmt(v)
            tc = LINE
            if color_signed and isinstance(v,(int,float)):
                tc = NEG if v < 0 else (POS if v > 0 else ZER)
            s.append(f'<text x="{x+cell/2}" y="{y+cell/2+6}" fill="{tc}" '
                     f'font-size="19" text-anchor="middle" font-weight="700">{txt}</text>')
            if circle_idx == (r,c):
                s.append(f'<circle cx="{x+cell/2}" cy="{y+cell/2}" r="{cell*0.38}" '
                         f'fill="none" stroke="{YEL}" stroke-width="2.5"/>')
    s.append("</svg>")
    return "".join(s)

# 1. gradient region (I0..I5)
labels = [["I0","I1","I2","I3"],["I4","I5","",""],["","","",""],["","","",""]]
def sub(t):
    if not t: return ""
    return t[0]+"<tspan baseline-shift='sub' font-size='12'>"+t[1:]+"</tspan>"
def grid_labels(vals, circle_idx=None):
    cell=58; pad=18; rows=len(vals); cols=len(vals[0])
    w=pad*2+cols*cell; h=pad*2+rows*cell
    s=[svg_open(w,h), panel(w,h)]
    for r in range(rows):
        for c in range(cols):
            x=pad+c*cell; y=pad+r*cell
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{PANEL2}" stroke="{GRID}" stroke-width="1.5"/>')
            v=vals[r][c]
            if v:
                s.append(f'<text x="{x+cell/2}" y="{y+cell/2+6}" fill="{LINE}" font-size="17" text-anchor="middle" font-weight="700">{sub(v)}</text>')
            if circle_idx==(r,c):
                s.append(f'<circle cx="{x+cell/2}" cy="{y+cell/2}" r="{cell*0.38}" fill="none" stroke="{YEL}" stroke-width="2.5"/>')
    s.append("</svg>"); return "".join(s)

save("gradient_region.svg", grid_labels(labels, circle_idx=(0,0)))

# 2. gradient example numbers
ex=[["60","120","131","122"],["70","91","",""],["","","",""],["","","",""]]
save("gradient_example.svg", grid_labels(ex, circle_idx=(0,0)))

# 3. edge-normal grid (diagonal light/dark) page 8
def edge_normal():
    cell=64; pad=18; vals=[[60,60,60,120],[60,60,120,120],[60,120,120,120],[120,120,120,120]]
    rows=4;cols=4
    w=pad*2+cols*cell; h=pad*2+rows*cell
    s=[svg_open(w,h),panel(w,h)]
    for r in range(rows):
        for c in range(cols):
            x=pad+c*cell;y=pad+r*cell
            v=vals[r][c]
            fill = "#3a3f52" if v==60 else "#c9cad2"
            tc = LINE if v==60 else "#1a1c24"
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{fill}" stroke="{GRID}"/>')
            s.append(f'<text x="{x+cell/2}" y="{y+cell/2+6}" fill="{tc}" font-size="17" text-anchor="middle" font-weight="700">{v}</text>')
    # dashed edge line (anti-diagonal of the boundary) and arrows (normals)
    s.append(f'<line x1="{pad+cell*0.0}" y1="{pad+cell*3.0}" x2="{pad+cell*3.0}" y2="{pad+cell*0.0}" stroke="{YEL}" stroke-width="3" stroke-dasharray="7 6"/>')
    for (sx,sy) in [(0.6,0.6),(1.6,1.6),(2.6,2.6)]:
        x1=pad+cell*sx; y1=pad+cell*sy
        x2=x1+cell*0.7; y2=y1+cell*0.7
        s.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{PUR}" stroke-width="3" marker-end="url(#ah)"/>')
    s.insert(1, f'<defs><marker id="ah" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="{PUR}"/></marker></defs>')
    s.append("</svg>"); return "".join(s)
save("edge_normal.svg", edge_normal())

# 4. gradient vector triangle
def grad_vector():
    w=360;h=240
    s=[svg_open(w,h),panel(w,h)]
    ax,ay=70,60; bx,by=290,60; cx,cy=290,180
    s.append(f'<line x1="{ax}" y1="{ay}" x2="{bx}" y2="{by}" stroke="{MUT}" stroke-width="2" stroke-dasharray="4 4"/>')
    s.append(f'<line x1="{bx}" y1="{by}" x2="{cx}" y2="{cy}" stroke="{MUT}" stroke-width="2" stroke-dasharray="4 4"/>')
    s.append(f'<line x1="{ax}" y1="{ay}" x2="{cx}" y2="{cy}" stroke="{PUR}" stroke-width="3.5" marker-end="url(#ah2)"/>')
    s.insert(1, f'<defs><marker id="ah2" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{PUR}"/></marker></defs>')
    s.append(f'<text x="{(ax+bx)/2}" y="{ay-10}" fill="{POS}" font-size="16" text-anchor="middle">&#948;x</text>')
    s.append(f'<text x="{bx+14}" y="{(by+cy)/2}" fill="{NEG}" font-size="16">&#948;y</text>')
    s.append(f'<text x="{ax+26}" y="{ay+22}" fill="{YEL}" font-size="16">&#952;</text>')
    s.append(f'<path d="M {ax+30} {ay} A 30 30 0 0 1 {ax+22} {ay+20}" fill="none" stroke="{YEL}" stroke-width="2"/>')
    s.append("</svg>"); return "".join(s)
save("gradient_vector.svg", grad_vector())

# 5. Roberts kernels
def two_kernels(k1,k2,t1,t2,sep_gap=40,cell=58):
    pad=18; top=pad+26
    rows=len(k1); cols=len(k1[0])
    kw=cols*cell
    w=pad*2+kw*2+sep_gap; h=top+rows*cell+pad
    s=[svg_open(w,h),panel(w,h)]
    def draw(k,ox,title):
        s.append(f'<text x="{ox+kw/2}" y="{pad+16}" fill="{LINE}" font-size="13" text-anchor="middle" font-weight="700">{title}</text>')
        for r in range(len(k)):
            for c in range(len(k[0])):
                x=ox+c*cell;y=top+r*cell;v=k[r][c]
                tc=NEG if v<0 else (POS if v>0 else ZER)
                s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{PANEL2}" stroke="{PUR}" stroke-width="1.5"/>')
                s.append(f'<text x="{x+cell/2}" y="{y+cell/2+6}" fill="{tc}" font-size="19" text-anchor="middle" font-weight="700">{v}</text>')
    draw(k1,pad,t1); draw(k2,pad+kw+sep_gap,t2)
    s.append("</svg>"); return "".join(s)

save("roberts_kernels.svg", two_kernels([[-1,0],[0,1]],[[0,-1],[1,0]],"diagonal 1","diagonal 2"))
save("prewitt_kernels.svg", two_kernels([[-1,-1,-1],[0,0,0],[1,1,1]],[[-1,0,1],[-1,0,1],[-1,0,1]],"horizontal","vertical"))
save("sobel_kernels.svg", two_kernels([[-1,-2,-1],[0,0,0],[1,2,1]],[[-1,0,1],[-2,0,2],[-1,0,1]],"horizontal","vertical"))
save("laplacian_kernels.svg", two_kernels([[0,-1,0],[-1,4,-1],[0,-1,0]],[[-1,-1,-1],[-1,8,-1],[-1,-1,-1]],"4-neighbour","8-neighbour"))

# 6. separability (row vec * col vec = matrix)
def separability(row, col, mat, label):
    cell=50; pad=18; top=pad+26
    # layout: [row 1x3] (x) [col 3x1] = [mat 3x3]
    w=900; h=200
    s=[svg_open(w,h),panel(w,h)]
    s.append(f'<text x="{w/2}" y="{pad+16}" fill="{LINE}" font-size="14" text-anchor="middle" font-weight="700">{label}</text>')
    def cellrect(x,y,v):
        tc=NEG if v<0 else (POS if v>0 else ZER)
        s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{PANEL2}" stroke="{GRID}"/>')
        s.append(f'<text x="{x+cell/2}" y="{y+cell/2+6}" fill="{tc}" font-size="17" text-anchor="middle" font-weight="700">{v}</text>')
    # row vector
    rx=40; ry=top+cell
    for c,v in enumerate(row): cellrect(rx+c*cell, ry, v)
    cx=rx+len(row)*cell+24
    s.append(f'<text x="{cx}" y="{ry+cell/2+8}" fill="{YEL}" font-size="26" text-anchor="middle">&#8855;</text>')
    # col vector
    colx=cx+24; coly=top
    for r,v in enumerate(col): cellrect(colx, coly+r*cell, v)
    eqx=colx+cell+24
    s.append(f'<text x="{eqx}" y="{coly+cell*1.5+8}" fill="{LINE}" font-size="26" text-anchor="middle">=</text>')
    mx=eqx+30; my=top
    for r in range(3):
        for c in range(3): cellrect(mx+c*cell, my+r*cell, mat[r][c])
    s.append("</svg>"); return "".join(s)

save("prewitt_separable.svg", separability([1,1,1],[-1,0,1],
     [[-1,-1,-1],[0,0,0],[1,1,1]], "Prewitt = averaging filter  &#8855;  edge detector"))
save("sobel_separable.svg", separability([1,2,1],[-1,0,1],
     [[-1,-2,-1],[0,0,0],[1,2,1]], "Sobel = weighted-average filter  &#8855;  edge detector"))

# 7. gaussian kernel 5x5
g=[[0.0352,0.0387,0.0399,0.0387,0.0352],
   [0.0387,0.0425,0.0438,0.0425,0.0387],
   [0.0399,0.0438,0.0452,0.0438,0.0399],
   [0.0387,0.0425,0.0438,0.0425,0.0387],
   [0.0352,0.0387,0.0399,0.0387,0.0352]]
def gauss_kernel():
    cell=72; pad=18; top=pad+26; rows=5;cols=5
    w=pad*2+cols*cell; h=top+rows*cell+pad
    s=[svg_open(w,h),panel(w,h)]
    s.append(f'<text x="{w/2}" y="{pad+16}" fill="{LINE}" font-size="14" text-anchor="middle" font-weight="700">5&#215;5 Gaussian kernel, &#963; = 4</text>')
    mx=max(max(r) for r in g); mn=min(min(r) for r in g)
    for r in range(rows):
        for c in range(cols):
            x=pad+c*cell;y=top+r*cell;v=g[r][c]
            t=(v-mn)/(mx-mn)
            # blend panel2 -> purple
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{PUR}" fill-opacity="{0.12+t*0.6:.2f}" stroke="{GRID}"/>')
            s.append(f'<text x="{x+cell/2}" y="{y+cell/2+5}" fill="{LINE}" font-size="14" text-anchor="middle">{v:.4f}</text>')
    s.append("</svg>"); return "".join(s)
save("gaussian_kernel.svg", gauss_kernel())

# 8. Canny direction wheel
def direction_wheel():
    import math
    w=380;h=380;cx=cy=190;R=150
    s=[svg_open(w,h),panel(w,h)]
    cats=[("horizontal", PUR),("+45", YEL),("vertical", POS),("-45", NEG)]
    # 8 sectors of 45deg, colored by 4 edge categories (opposite sectors same)
    seg=45
    for i in range(8):
        a0=math.radians(i*seg-22.5-90); a1=math.radians((i+1)*seg-22.5-90)
        x0=cx+R*math.cos(a0); y0=cy+R*math.sin(a0)
        x1=cx+R*math.cos(a1); y1=cy+R*math.sin(a1)
        col=cats[i%4][1]
        s.append(f'<path d="M {cx} {cy} L {x0:.1f} {y0:.1f} A {R} {R} 0 0 1 {x1:.1f} {y1:.1f} Z" '
                 f'fill="{col}" fill-opacity="0.25" stroke="{GRID}" stroke-width="1"/>')
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{MUT}" stroke-width="1.5"/>')
    # axis labels
    s.append(f'<text x="{cx}" y="{cy-R-6}" fill="{POS}" font-size="13" text-anchor="middle">vertical edge</text>')
    s.append(f'<text x="{cx}" y="{cy+R+18}" fill="{POS}" font-size="13" text-anchor="middle">90/-90&#176;</text>')
    s.append(f'<text x="{cx+R+4}" y="{cy+4}" fill="{PUR}" font-size="13">horiz</text>')
    s.append(f'<text x="{cx-R-30}" y="{cy+4}" fill="{PUR}" font-size="13">0/180&#176;</text>')
    s.append(f'<text x="{cx+R*0.75}" y="{cy-R*0.6}" fill="{YEL}" font-size="12">+45&#176;</text>')
    s.append(f'<text x="{cx-R*0.95}" y="{cy-R*0.6}" fill="{NEG}" font-size="12">-45&#176;</text>')
    s.append("</svg>"); return "".join(s)
save("direction_wheel.svg", direction_wheel())

# 9. Marr-Hildreth neighbourhood a b c / d e f / h h i
def mh_grid():
    cell=64; pad=18; rows=3;cols=3
    lab=[["a","b","c"],["d","e","f"],["h","h","i"]]
    w=pad*2+cols*cell;h=pad*2+rows*cell
    s=[svg_open(w,h),panel(w,h)]
    for r in range(3):
        for c in range(3):
            x=pad+c*cell;y=pad+r*cell;v=lab[r][c]
            center = (r==1 and c==1)
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{PANEL2}" stroke="{GRID}"/>')
            tc = YEL if center else LINE
            fw = "800" if center else "500"
            s.append(f'<text x="{x+cell/2}" y="{y+cell/2+7}" fill="{tc}" font-size="22" text-anchor="middle" font-weight="{fw}">{v}</text>')
    s.append("</svg>"); return "".join(s)
save("marr_hildreth.svg", mh_grid())

# 10. template matching 3x3 over 4x4 (page 60)
def template_match():
    cell=52; pad=18; gap=46
    # template 3x3 with greys, image 4x4 with greys
    tg=[[0.78,1,1],[0.55,1,1],[0.40,0.66,1]]  # greys (1=white)
    ig=[[0.02,0.02,1,1],[0.25,1,0.66,1],[1,0.55,1,1],[1,0.40,0.78,1]]
    tw=3*cell; iw=4*cell
    top=pad+24
    w=pad*2+tw+gap+iw; h=top+4*cell+pad
    s=[svg_open(w,h),panel(w,h)]
    s.append(f'<text x="{pad+tw/2}" y="{pad+15}" fill="{MUT}" font-size="12" text-anchor="middle">template W</text>')
    s.append(f'<text x="{pad+tw+gap+iw/2}" y="{pad+15}" fill="{MUT}" font-size="12" text-anchor="middle">image I</text>')
    def g2hex(v): 
        c=int(v*235)+10; return f'#{c:02x}{c:02x}{c:02x}'
    for r in range(3):
        for c in range(3):
            x=pad+c*cell;y=top+r*cell
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{g2hex(tg[r][c])}" stroke="{PUR}" stroke-width="1.5"/>')
    s.append(f'<circle cx="{pad+cell*1.5}" cy="{top+cell*1.5}" r="13" fill="none" stroke="{PUR}" stroke-width="2"/>')
    ox=pad+tw+gap
    for r in range(4):
        for c in range(4):
            x=ox+c*cell;y=top+r*cell
            stroke = PUR if (r<3 and c<3) else GRID
            sw = "2" if (r<3 and c<3) else "1"
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{g2hex(ig[r][c])}" stroke="{stroke}" stroke-width="{sw}"/>')
    s.append(f'<circle cx="{ox+cell*1.5}" cy="{top+cell*1.5}" r="13" fill="none" stroke="{PUR}" stroke-width="2"/>')
    s.append("</svg>"); return "".join(s)
save("template_match.svg", template_match())

# 11. convolution cycle example (page 25)
def conv_cycle():
    cell=46; pad=18
    w=560;h=220
    s=[svg_open(w,h),panel(w,h)]
    # row vector sliding over implied, producing 3x3
    s.append(f'<text x="{w/2}" y="{pad+14}" fill="{LINE}" font-size="13" text-anchor="middle" font-weight="700">[1 1 1] &#8855; [-1,0,1]&#7488; cycles to build the kernel</text>')
    top=pad+30
    rowv=[1,1,1]; colv=[-1,0,1]
    # show col vector
    cx=40
    for r,v in enumerate(colv):
        y=top+r*cell
        tc=NEG if v<0 else (POS if v>0 else ZER)
        s.append(f'<rect x="{cx}" y="{y}" width="{cell}" height="{cell}" fill="{PANEL2}" stroke="{GRID}"/>')
        s.append(f'<text x="{cx+cell/2}" y="{y+cell/2+6}" fill="{tc}" font-size="17" text-anchor="middle" font-weight="700">{v}</text>')
    s.append(f'<text x="{cx+cell+18}" y="{top+cell*1.5+6}" fill="{YEL}" font-size="22">&#8594;</text>')
    res=[[-1,-1,-1],[0,0,0],[1,1,1]]
    mx=cx+cell+44
    for r in range(3):
        for c in range(3):
            x=mx+c*cell;y=top+r*cell;v=res[r][c]
            tc=NEG if v<0 else (POS if v>0 else ZER)
            s.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{PANEL2}" stroke="{GRID}"/>')
            s.append(f'<text x="{x+cell/2}" y="{y+cell/2+6}" fill="{tc}" font-size="16" text-anchor="middle" font-weight="700">{v}</text>')
    s.append("</svg>"); return "".join(s)
save("conv_cycle.svg", conv_cycle())

print("ALL DONE")
