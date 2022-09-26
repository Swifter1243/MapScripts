// deno-lint-ignore no-unused-vars
import { AnimationInternals, ComplexKeyframesVec3, copy, CustomEvent, CustomEventInternals, debugObject, Difficulty, Environment, EVENT, Event, exportZip, Geometry, info, isSimple, KeyframesLinear, KeyframesVec3, LightRemapper, ModelScene, Note, PRESET, RawKeyframesVec3, Regex, RMLog, settings, transferVisuals, Vec3, Wall } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless", "ExpertPlusStandard");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

//! Fog
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog");
animTrack.animate.startY = [2100];
animTrack.animate.height = [-1000];
animTrack.push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}

fogAttentuation(0, [1 / 10000]);
fogAttentuation(332, [1 / 10000000]);
fogAttentuation(460, [1 / 10000]);
fogAttentuation(524, [1 / 10000000]);
fogAttentuation(638, [[1 / 10000000, 0], [1 / 10000, 1, "easeInCirc"]], 12);
fogAttentuation(650, [[1 / 10000, 0], [1 / 10000000, 1, "easeInOutExpo"]], 2);
fogAttentuation(780, [1 / 10000]);

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

// Contains
remove([
    "Smoke",
    "WaterRainRipples",
    "Mountain",
    "RectangleFakeGlow",
    "Mirror",
    "Cloud",
    "Waterfall"
])

env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

const sunSize = 30;
const flareID = (id: number) => new Regex("Sun").separate().add("NeonTube").vary(id).end();

env = new Environment("Sun$", "Regex");
env.scale = [1, 1, 1].map(x => x * sunSize) as Vec3;
env.position = [0, 0, 2800];
env.push();

env = new Environment(flareID(0), "Regex")
env.scale = [1, 1, 1].map(x => x * 20 / sunSize) as Vec3;
env.push();

env = new Environment(flareID(1), "Regex")
env.scale = [1, 1, 1].map(x => x * 20 / sunSize) as Vec3;
env.push();

env = new Environment(flareID(2), "Regex")
env.scale = [7, 2, 1].map(x => x * 20 / sunSize) as Vec3;
env.push();

// Model 

const rotatingLights: string[] = []
const lights: string[] = []

function trackPush(env: Environment, track: string, pushArr: string[]) {
    pushArr.push(track);
    env.track = track;
    env.push();
}

const baseLightID = (vary = 0) => new Regex().add("LightRailingSegment").vary(vary).separate().add("NeonTubeDirectionalL").string;

const BLOOM_LIGHT = {
    ID: baseLightID() + "$",
    SCALE: <Vec3>[1, 0.2, 1]
}

for (let s = -1; s <= 1; s += 2) for (let l = 0; l <= 8; l++) {
    const side = s === -1 ? "L" : "R";
    const ID = new Regex().add("BottomPairLasers").vary(l).separate().add(`Pillar${side}`).end();

    env = new Environment(ID, "Regex");
    const track = `rotating_${side}_${l}`;
    trackPush(env, track, rotatingLights);
}

env = new Environment(new Regex().add(baseLightID()).separate().add("BoxLight").end(), "Regex");
env.active = false;
env.push();

env = new Environment(BLOOM_LIGHT.ID, "Regex");
env.duplicate = 1;
env.lightID = 100;

for (let i = 1; i <= 4; i++) trackPush(env, `bloomLaser${i}`, lights);

env.id = baseLightID(1) + "$";
env.lightID = 200;

for (let i = 1; i <= 9; i++) trackPush(env, `laser${i}`, lights);

//! Lights

/*
? SUN: SUN
? SOLID LASERS: LEFT SUNBEAMS ID 1-8
? DEATH BEAM: LEFT SUNBEAMS ID 9
*/

new LightRemapper().type(2).range([1, 8]).setType(6).addToEnd(199).multiplyColor(1, 3).run(); // Solid Lasers
new LightRemapper().type(2).IDs([9]).setType(6).addToEnd(199).multiplyColor(1, 1).run(); // Death Beam
new LightRemapper().type(4).setType(EVENT.CENTER_LASERS).setIDs([1, 2, 3, 4, 5]).run(); // Sun

//! Model

const breakDur = 5;
const breakStart = 524; // 3:16
const breakEnd = 652; // 4:04

const scene = new ModelScene(new Geometry("Cube", "standard"));
scene.addPrimaryGroups("cloud", new Geometry("Sphere", "standard"));
scene.assignObjects(rotatingLights, undefined, [0, 1.75, 2]);
scene.assignObjects(lights, BLOOM_LIGHT.SCALE);

const objLookup: Record<string, {
    pos: Vec3,
    rot: Vec3,
    scale: Vec3
}> = {};

const getValuesVec3 = (keyframe: ComplexKeyframesVec3[0]) => [keyframe[0], keyframe[1], keyframe[2]];
const getFirstKeyframeVec3 = (anim: RawKeyframesVec3) => (isSimple(anim) ? anim : getValuesVec3((anim as ComplexKeyframesVec3)[0])) as Vec3;
const reverseAnim = (anim: ComplexKeyframesVec3) => copy(anim).map(x => { x[3] = 1 - x[3]; return x }) as ComplexKeyframesVec3;

scene.optimizer.active = false;

scene.animate([
    ["env", breakStart, breakDur, x => {
        const pos = getFirstKeyframeVec3(x.animate.position as RawKeyframesVec3);
        const rot = getFirstKeyframeVec3(x.animate.rotation as RawKeyframesVec3);
        const scale = getFirstKeyframeVec3(x.animate.scale as RawKeyframesVec3);

        if ((x.track.value as string).includes("modelScene")) {
            objLookup[x.track.value as string] = {
                pos: pos,
                rot: rot,
                scale: scale
            }
        }
        else {
            animTrack = new CustomEvent().animateTrack(x.track.value);
            animTrack.animate.position = pos;
            animTrack.animate.rotation = rot;
            animTrack.animate.scale = scale;
            animTrack.push();
        }

        if (!isSimple(x.animate.position) || !isSimple(x.animate.rotation)) {
            const newEvent = new CustomEvent(breakEnd - breakDur).animateTrack(x.track.value, breakDur);
            newEvent.animate.position = reverseAnim(x.animate.position as ComplexKeyframesVec3);
            newEvent.animate.rotation = reverseAnim(x.animate.rotation as ComplexKeyframesVec3);
            newEvent.time = breakEnd - breakDur;
            newEvent.push();
        }
    }]
])

map.rawEnvironment.forEach(x => {
    const lookup = objLookup[x.track];
    if (lookup) {
        x.position = lookup.pos;
        x.rotation = lookup.rot;
        x.scale = lookup.scale;
    }
})

// EXPORT
function exportMap(diff: Difficulty) {
    diff.geoMaterials["standard"] = {
        _shader: "Standard"
    }

    diff.require("Chroma");
    diff.require("Noodle Extensions", false);
    diff.rawSettings = PRESET.CHROMA_SETTINGS;
    diff.settings.smoke = false;
    diff.settings.mirrorQuality = "OFF";
    diff.settings.noHud = true;
    diff.notes.forEach(x => {
        x.spawnEffect = false;
    })
}
exportMap(map);
map.save();
transferVisuals(["ExpertStandard.dat", "HardStandard.dat"], x => { exportMap(x) });
exportZip(["ExpertPlusLawless"]);