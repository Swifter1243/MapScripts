// deno-lint-ignore no-unused-vars
import { ColorType, ComplexKeyframesVec3, copy, CustomEvent, CustomEventInternals, debugObject, Difficulty, EASE, ENV, Environment, EVENT, Event, exportZip, Geometry, info, isSimple, KeyframesLinear, LightRemapper, LOOKUP, ModelObject, ModelScene, PRESET, rand, RawKeyframesVec3, Regex, settings, transferVisuals, Vec3, Wall } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless", "ExpertPlusStandard");

let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

//! Fog
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog");
animTrack.animate.startY = [-69420];
animTrack.push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}

fogAttentuation(0, [1 / 3000]);
fogAttentuation(133, [1 / 200000]);
fogAttentuation(229 - 5, [[1 / 200000, 0], [1 / 3000, 1, "easeInOutExpo"]], 10);
fogAttentuation(517, [1 / 50000]);

//! Environment

// Removal
function remove(ids: string[], regex = false) {
    env = new Environment(undefined, regex ? "Regex" : undefined);
    env.active = false;

    ids.forEach(x => {
        env.id = x;
        env.push();
    })
}

remove([
    "BackCube",
    "Tube",
    "Pillar",
    "Tesla",
    "Logo",
    "Runway",
    "Smoke",
    "RectangleFakeGlow"
])

remove([new Regex("Environment").separate().add("Construction").end()], true);

env = new Environment("DirectionalLight");
env.rotation = [0, 110, 0];
env.push();

// Model
const auroraLights: string[] = []
const solidLights: string[] = []

function trackPush(env: Environment, track: string, pushArr: string[]) {
    pushArr.push(track);
    env.track = track;
    env.push();
}

const SOLID_LIGHT = {
    ID: [new Regex("FrontLasers").separate().add("FrontLaserL").end(), "Regex"],
    TRANSFORM: <Vec3[]>[
        [1 / 1.8, 0.0012, 1 / 1.8],
        [0, -0.5, 0]
    ]
}

const auroras = 35;
env = new Environment(ENV.GAGA.SECOND_AURORA.ID, "Regex");
env.lightID = 100;
env.duplicate = 1;
for (let i = 1; i <= auroras; i++) trackPush(env, `aurora${i}`, auroraLights);

const solids = 10;
env = new Environment(...SOLID_LIGHT.ID);
env.lightID = 200;
env.duplicate = 1;
for (let i = 1; i <= solids; i++) trackPush(env, `solid${i}`, solidLights);

//! Model
const swayLoops = 4;

const posLookup: Record<string, {
    pos: Vec3,
    rot: Vec3,
    scale: Vec3
}> = {};

const scene = new ModelScene(new Geometry("Cube", "standard"));
scene.assignObjects(solidLights, ...SOLID_LIGHT.TRANSFORM);
scene.assignObjects(auroraLights, ENV.GAGA.SECOND_AURORA.SCALE, ENV.GAGA.SECOND_AURORA.ANCHOR);
scene.animate([
    [{
        input: "env",
        objects: arr => {
            arr.forEach(obj => {
                const newTime = (time: number, index: number) => (time / (swayLoops * 2)) + (index / (swayLoops * 2));

                function loopAnim(anim: ComplexKeyframesVec3) {
                    const newAnim: ComplexKeyframesVec3 = [];
                    for (let i = 0; i < swayLoops; i++) {
                        anim.forEach(x => {
                            const values: Vec3 = [x[0], x[1], x[2]];
                            newAnim.push([...values, newTime(x[3], i * 2)]);
                            newAnim.push([...values, newTime(1 - x[3], i * 2 + 1)]);
                        })
                    }
                    return newAnim;
                }

                if (!isSimple(obj.pos))
                    obj.pos = loopAnim(obj.pos as ComplexKeyframesVec3);
                if (!isSimple(obj.rot))
                    obj.rot = loopAnim(obj.rot as ComplexKeyframesVec3);
                if (!isSimple(obj.scale))
                    obj.scale = loopAnim(obj.scale as ComplexKeyframesVec3);
            })
        },
        processing: swayLoops
    }, 133, 229 - 133, event => {
        const getValuesVec3 = (keyframe: ComplexKeyframesVec3[0]) => [keyframe[0], keyframe[1], keyframe[2]];
        const getFirstKeyframeVec3 = (anim: RawKeyframesVec3) => (isSimple(anim) ? anim : getValuesVec3((anim as ComplexKeyframesVec3)[0])) as Vec3;

        posLookup[event.track.value as string] = {
            pos: getFirstKeyframeVec3(event.animate.position as RawKeyframesVec3),
            rot: getFirstKeyframeVec3(event.animate.rotation as RawKeyframesVec3),
            scale: getFirstKeyframeVec3(event.animate.scale as RawKeyframesVec3)
        }
    }]
])

map.rawEnvironment.forEach(x => {
    const lookup = posLookup[x.track];
    if (lookup) {
        x.position = lookup.pos;
        x.rotation = lookup.rot;
        x.scale = lookup.scale;
    }
})


//! Lights
/*
? PORTAL EDGES: RING LIGHTS 1-35
? PORTALS: LEFT LASERS
? SOLID LIGHTS: BACK LASERS
? DIRECTIONAL LIGHT: ALL RIGHT LASERS
*/

// PORTALS
const lr = new LightRemapper().type(EVENT.LEFT_LASERS).setType(EVENT.RING_LIGHTS).addToEnd(0, 5);
lr.addProcess(x => {
    // Doing this because I want to have left lasers control individual portals
    if (x.lightID && typeof x.lightID === "number") {
        const base = x.lightID;
        const newID: number[] = [];
        for (let i = 0; i <= 4; i++) newID.push(base + i);
        x.lightID = newID;
    }
})
lr.run();
// PORTAL EDGES
new LightRemapper().type(EVENT.RING_LIGHTS).initIDs([1, auroras], true).addToEnd(99).multiplyColor(5, 2).run();
// SOLID LIGHTS
new LightRemapper().type(EVENT.BACK_LASERS).setType(EVENT.CENTER_LASERS).initIDs([1, solids], true).multiplyColor(2).addToEnd(199).run();

const wall = new Wall();
wall.NJS = 0;
wall.offset = 20;
wall.life = 114.25
wall.lifeStart = 710
console.log(wall.json)


// Export
function exportMap(diff: Difficulty) {
    diff.geoMaterials["standard"] = {
        _shader: "Standard"
    }

    info.environment = "GagaEnvironment";
    map.rawSettings = PRESET.CHROMA_SETTINGS;
    diff.settings.mirrorQuality = "OFF";
    diff.settings.noHud = true;
    diff.require("Chroma");
    diff.require("Noodle Extensions", false)
    diff.notes.forEach(x => {
        x.spawnEffect = false;
    })
}
exportMap(map);
map.save();
transferVisuals(["ExpertStandard", "HardStandard", "NormalStandard", "EasyStandard"], x => { exportMap(x) });
exportZip(["ExpertPlusLawless"])