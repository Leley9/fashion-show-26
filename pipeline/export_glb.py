# export_glb.py — exporte la scène Blender en GLB
# Appelé en arrière-plan par update-model.sh :
#   blender -b fichier.blend --python export_glb.py -- /chemin/sortie.glb
import bpy, sys

# Récupère le chemin de sortie passé après "--"
argv = sys.argv
out = argv[argv.index("--") + 1] if "--" in argv else "/tmp/out.glb"

bpy.ops.export_scene.gltf(
    filepath=out,
    export_format='GLB',
    use_selection=False,        # toute la scène
    export_apply=True,          # applique les modifiers
    export_yup=True,            # Y vers le haut (convention three.js)
    export_cameras=False,
    export_lights=False,
)
print(f"[export_glb] GLB écrit : {out}")
