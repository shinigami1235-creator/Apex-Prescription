"""Blender stages for the ApexSx product page previews.

Run:  python3 stages.py <stage> <aspect> <samples> <out_dir>
stage:  ring | shelf | plinth
aspect: wide (1920x1080) | tall (1080x1350)
Writes <stage>-<aspect>.png plus <stage>-<aspect>.json with the screen
positions (0-1 of width/height) of every standing spot, so the page can
place the product cutouts on the rendered surfaces.
"""
import sys, json, math, os
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
stage, aspect, samples, out = argv[0], argv[1], int(argv[2]), argv[3]
os.makedirs(out, exist_ok=True)

# Brand colours taken from the live site (header #3C2F55, lavender #E7E2EF)
AUBERGINE = (0.045, 0.028, 0.092, 1)
LAVENDER = (0.80, 0.76, 0.86, 1)
LILAC = (0.62, 0.50, 0.80, 1)
PEARL = (0.93, 0.92, 0.95, 1)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = samples
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = (1920, 1080) if aspect == "wide" else (1080, 1350)
sc.render.film_transparent = False
sc.render.resolution_percentage = int(os.environ.get("PCT", "100"))
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
sc.view_settings.exposure = float(os.environ.get("EXPO", "-1.4"))
sc.render.image_settings.file_format = "PNG"


def mat(name, base, rough=0.4, metal=0.0, trans=0.0, coat=0.0, emit=None, emit_s=0.0, ior=1.45):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Transmission Weight"].default_value = trans
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["IOR"].default_value = ior
    if emit:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = emit_s
    return m


def add(obj, m):
    obj.data.materials.append(m)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def bevel(obj, w=0.02, seg=6):
    md = obj.modifiers.new("bev", "BEVEL")
    md.width, md.segments = w, seg
    md.limit_method = "ANGLE"
    return obj


def cyl(r, h, z0, verts=160, name="cyl"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(0, 0, z0 + h / 2))
    o = bpy.context.object
    o.name = name
    return o


def world():
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.84, 0.80, 0.90, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35


def cove(color, half=30, r=4.0, wall_y=8.0):
    """Seamless floor-to-wall backdrop: floor, quarter-round fillet, wall."""
    prof = [(-40.0, 0.0)]
    for i in range(25):
        t = math.pi / 2 * i / 24
        prof.append((wall_y - r + math.sin(t) * r, r - math.cos(t) * r))
    prof.append((wall_y, 40.0))
    me = bpy.data.meshes.new("cove")
    verts = [(x, y, z) for x in (-half, half) for (y, z) in prof]
    n = len(prof)
    faces = [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]
    me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new("cove", me)
    sc.collection.objects.link(o)
    add(o, color)
    return o, None, None


def area(name, loc, rot, size, energy, color=(1, 1, 1)):
    bpy.ops.object.light_add(type="AREA", location=loc, rotation=rot)
    l = bpy.context.object
    l.name = name
    l.data.size = size
    l.data.energy = energy
    l.data.color = color
    l.visible_camera = False  # lights never show up as bright panels in shot
    return l


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(loc, target, lens):
    bpy.ops.object.camera_add(location=loc)
    c = bpy.context.object
    c.data.lens = lens
    look_at(c, target)
    sc.camera = c
    return c


def proj(p):
    bpy.context.view_layer.update()
    v = world_to_camera_view(sc, sc.camera, Vector(p))
    return [round(v.x, 5), round(1 - v.y, 5)]


world()
backdrop = mat("backdrop", (0.86, 0.82, 0.91, 1), rough=0.9)
spots = {}

def platform():
    """Pearl round platform, violet chrome band and upright halo: shared by the ring and the routine steps."""
    R, H = 4.2, 0.32
    add(bevel(cyl(R, H, 0, name="platform"), 0.06), mat("satin", (0.95, 0.94, 0.97, 1), rough=0.28, coat=0.6))
    add(cyl(R + 0.012, 0.07, H - 0.11, name="band"), mat("chrome", LILAC, rough=0.12, metal=1.0))
    add(bevel(cyl(R * 0.62, 0.045, H, name="inner"), 0.01), mat("frost", (0.88, 0.84, 0.94, 1), rough=0.18, coat=1.0))
    bpy.ops.mesh.primitive_torus_add(major_radius=4.3, minor_radius=0.06, major_segments=220, minor_segments=24,
                                     location=(0, 3.6, 4.1), rotation=(math.radians(90), 0, 0))
    add(bpy.context.object, mat("halo", LILAC, rough=0.15, metal=1.0))
    cove(backdrop)
    area("key", (-5, -6, 9), (math.radians(40), 0, math.radians(-35)), 7, 2600)
    area("fill", (7, -4, 5), (math.radians(60), 0, math.radians(55)), 6, 900, (0.92, 0.9, 1.0))
    area("rim", (0, 6, 8), (math.radians(-35), 0, 0), 5, 900, (0.85, 0.78, 1.0))
    # higher camera than before so the back of the ring sits above the front instead of behind it
    if aspect == "wide":
        camera((0, -14.8, 7.6), (0, 0.4, 1.55), 50)
    else:
        camera((0, -11.0, 7.2), (0, 0.15, 1.45), 38)
    return R, H + 0.045


if stage == "ring":
    R, top = platform()
    ring_r = R * 0.82
    pts = []
    for i in range(72):
        a = 2 * math.pi * i / 72
        x, y = math.sin(a) * ring_r, -math.cos(a) * ring_r
        p0 = proj((x, y, top)); p1 = proj((x, y, top + 1.0))
        pts.append({"a": round(a, 4), "foot": p0, "unit_h": round(p0[1] - p1[1], 5)})
    spots = {"ring": pts, "center": proj((0, 0, top)),
             "center_unit_h": round(proj((0, 0, top))[1] - proj((0, 0, top + 1))[1], 5)}

elif stage == "steps":
    # The routine: four pedestals rising left to right along the front of the same platform
    R, top = platform()
    stone = mat("stone", (0.95, 0.94, 0.97, 1), rough=0.3, coat=0.7)
    chrome = mat("chrome2", LILAC, rough=0.12, metal=1.0)
    out_steps = []
    for i, ang in enumerate([-64, -22, 22, 64]):
        a = math.radians(ang)
        x, y = math.sin(a) * 3.05, -math.cos(a) * 1.7 + 0.45
        hgt = 0.32 + i * 0.3
        bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=0.7, depth=hgt, location=(x, y, top + hgt / 2))
        add(bevel(bpy.context.object, 0.04), stone)
        bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=0.72, depth=0.05, location=(x, y, top + hgt - 0.09))
        add(bpy.context.object, chrome)
        t = top + hgt
        f0 = proj((x, y, t)); f1 = proj((x, y, t + 1))
        out_steps.append({"foot": f0, "unit_h": round(f0[1] - f1[1], 5), "face": proj((x, y - 0.8, top + hgt * 0.45))})
    spots = {"steps": out_steps}

elif stage == "shelf":
    # Four stepped frosted blocks rising left to right: the routine in order of use
    steps = []
    widths, heights = 2.3, [0.55, 0.95, 1.35, 1.75]
    gap = 0.18
    x0 = -1.5 * (widths + gap)
    frost = mat("frost", (0.94, 0.93, 0.97, 1), rough=0.22, coat=1.0)
    edge = mat("edge", LILAC, rough=0.12, metal=1.0)
    for i, h in enumerate(heights):
        x = x0 + i * (widths + gap)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, h / 2))
        b = bpy.context.object
        b.scale = (widths, 1.9, h)
        bpy.ops.object.transform_apply(scale=True)
        add(bevel(b, 0.08, 8), frost)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -0.955, h - 0.06))
        t = bpy.context.object
        t.scale = (widths - 0.16, 0.012, 0.035)
        bpy.ops.object.transform_apply(scale=True)
        add(t, edge)
        steps.append((x, h))
    f, w, j = cove(mat("wall", (0.88, 0.85, 0.93, 1), rough=0.9))
    area("key", (-6, -7, 9), (math.radians(42), 0, math.radians(-38)), 8, 2800)
    area("fill", (8, -5, 4), (math.radians(65), 0, math.radians(58)), 6, 800, (0.92, 0.9, 1.0))
    area("rim", (0, 5, 7), (math.radians(-40), 0, 0), 6, 700, (0.85, 0.78, 1.0))
    if aspect == "wide":
        camera((0, -14.0, 4.7), (0, 0, 1.9), 50)
    else:
        camera((0, -15.5, 5.6), (0, 0, 1.6), 38)
    spots = {"steps": [{"foot": proj((x, -0.05, h)), "unit_h": round(proj((x, -0.05, h))[1] - proj((x, -0.05, h + 1))[1], 5),
                        "face": proj((x, -0.96, h * 0.45))} for x, h in steps]}

elif stage == "plinth":
    pl = add(bevel(cyl(1.25, 1.6, 0, name="plinth"), 0.05), mat("stone", (0.94, 0.93, 0.96, 1), rough=0.35, coat=0.5))
    cap = add(bevel(cyl(1.32, 0.09, 1.6, name="cap"), 0.02), mat("chrome", LILAC, rough=0.12, metal=1.0))
    bpy.ops.mesh.primitive_torus_add(major_radius=2.45, minor_radius=0.045, major_segments=200, minor_segments=20,
                                     location=(0, 2.2, 3.15), rotation=(math.radians(90), 0, 0))
    add(bpy.context.object, mat("halo", LILAC, rough=0.15, metal=1.0))
    bpy.ops.mesh.primitive_circle_add(vertices=128, radius=2.15, fill_type="NGON", location=(0, 2.3, 3.15), rotation=(math.radians(90), 0, 0))
    disc = add(bpy.context.object, mat("glow", (0.9, 0.86, 0.97, 1), rough=0.9, emit=(0.86, 0.80, 0.98, 1), emit_s=0.35))
    f, w, j = cove(backdrop)
    area("key", (-4, -5, 8), (math.radians(38), 0, math.radians(-35)), 5, 1600)
    area("top", (0, -0.5, 7), (0, 0, 0), 2.5, 700)
    area("rim", (3, 4, 5), (math.radians(-50), 0, math.radians(150)), 4, 700, (0.85, 0.78, 1.0))
    if aspect == "wide":
        camera((0, -12, 3.6), (0, 0, 2.5), 50)
    else:
        camera((0, -9.6, 3.3), (0, 0, 2.55), 42)
    top = 1.69
    spots = {"foot": proj((0, 0, top)), "unit_h": round(proj((0, 0, top))[1] - proj((0, 0, top + 1))[1], 5)}

name = f"{stage}-{aspect}"
sc.render.filepath = os.path.join(out, name + ".png")
spots["size"] = [sc.render.resolution_x, sc.render.resolution_y]
json.dump(spots, open(os.path.join(out, name + ".json"), "w"))
if os.environ.get("BLEND"):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, name + ".blend"))
if samples > 0:
    bpy.ops.render.render(write_still=True)
print("done", name)
