// deno-lint-ignore no-unused-vars
import { AnimationInternals, arrAdd, ComplexKeyframesVec3, copy, CustomEvent, CustomEventInternals, debugObject, Difficulty, Environment, EVENT, Event, eventsBetween, exportZip, Geometry, GEO_SHADER, info, isSimple, KeyframesLinear, KeyframesVec3, LightRemapper, ModelScene, Note, PRESET, RawKeyframesVec3, Regex, RMLog, rotatePoint, settings, transferVisuals, Vec3, Vec4, Wall } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless.dat", "EasyStandard.dat");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

/*
- Make shockwave with circle of bloom lasers
*/

//! Fog
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog");
animTrack.animate.startY = [-400];
animTrack.animate.height = [200];
animTrack.push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}

fogAttentuation(0, [1 / 100000]);
fogAttentuation(635.09, [1 / 100]);

//! Environment

const outroTime = 561.79443 + (-1 / 16);

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
    "Clouds"
])

env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

env = new Environment("Waterfall$", "Regex");
env.scale = [900, 1, 90].map(x => x * 0.5) as Vec3;
env.position = [0, 200, -50]
env.rotation = [0, 0, 180]
env.track = "water";
env.push();

animTrack = new CustomEvent(outroTime).animateTrack("water");
animTrack.animate.position = "yeet";
animTrack.push();

env = new Environment("Smoke");
env.scale = [1000, 3, 1000];
env.position = [0, 0, 50];
env.rotation = [0, 0, 0]
env.active = true;
env.track = "smoke";
env.push();

animTrack = new CustomEvent(outroTime).animateTrack("smoke");
animTrack.animate.scale = [1000, 9, 1000];
animTrack.push();

animTrack = new CustomEvent(635.09).animateTrack("smoke");
animTrack.animate.position = "yeet";
animTrack.push();

env = new Environment("Sun$", "Regex");
env.track = "iris"
env.push();

env = new Environment(new Regex("Sun").separate().add("NeonTube").vary(2).end(), "Regex")
env.scale = [10, 0.25, 1] as Vec3;
env.track = "flare";
env.push();

animTrack = new CustomEvent(outroTime).animateTrack("flare");
animTrack.animate.scale = [8, 4, 1];
animTrack.push();

env = new Environment("Rain$", "Regex");
env.duplicate = 1;
env.lightID = 100;
env.scale = [1, 10000, 0.2];
env.rotation = [0, 0, 90];
env.position = [0, 0, 15]
env.push();

env.position[1] = 1;
env.rotation = [0, 0, -90];
env.push();

env.scale[0] = 5;
env.position[1] = -1;
env.push();

env.scale[0] = 10;
env.position[1] = 0.5;
env.rotation = [0, 0, 90];
env.push();

// Model 

const lights: string[] = []
const rotatingLights: string[] = []

function trackPush(env: Environment, track: string, pushArr: string[]) {
    pushArr.push(track);
    env.track = track;
    env.push();
}

const baseLightID = (vary = 0) => new Regex().add("LightRailingSegment").vary(vary).separate().add("NeonTubeDirectionalL").string;

const BLOOM_LIGHT = {
    ID: baseLightID() + "$",
    SCALE: <Vec3>[4, 0.2, 4]
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

const shockwaveAmount = 20;

env = new Environment(BLOOM_LIGHT.ID, "Regex");
env.duplicate = 1;
env.lightID = 400;

for (let i = 1; i <= shockwaveAmount; i++) {
    env.track = `shockwave${i}`;
    env.push();
}

env.id = baseLightID(1) + "$";
env.lightID = 200;

trackPush(env, "distress", lights)
for (let i = 1; i <= 9; i++) trackPush(env, `laser${i}`, lights);

//! Lights

/*
? STATIC: Water 4
? SHOCKWAVE: Water 1
? EYE: Sun
? DISTRESS SIGNAL: Water 2
? TEXT: Water 3
? LASERS: LEFT SUNBEAMS 1-9
*/

// Distress signal
new LightRemapper().type(6).setIDs(200).multiplyColor(2).run();
// Left sunbeams
new LightRemapper().type(2).setType(6).addToEnd(200).run();
// Static
new LightRemapper().type(0).setType(EVENT.BACK_LASERS).setIDs([100, 101, 102, 103]).multiplyColor(2).run();

//! Model

map.geoMaterials.standard = {
    _shader: "Standard"
}

env.lightID = 300;

const posLookup: Record<string, {
    pos: Vec3,
    rot: Vec3,
    scale: Vec3
}> = {};

const scene = new ModelScene(new Geometry(undefined, "standard"));
scene.assignObjects(lights, BLOOM_LIGHT.SCALE);
scene.assignObjects(rotatingLights);
scene.addPrimaryGroups("eye", env, BLOOM_LIGHT.SCALE)
scene.assignObjects("iris");
scene.assignObjects("shockwave")
scene.animate([
    ["env", 382.49966, 464.07565 - 382.49966 + 10, event => {
        const getValuesVec3 = (keyframe: ComplexKeyframesVec3[0]) => [keyframe[0], keyframe[1], keyframe[2]];
        const getFirstKeyframeVec3 = (anim: RawKeyframesVec3) => (isSimple(anim) ? anim : getValuesVec3((anim as ComplexKeyframesVec3)[0])) as Vec3;

        posLookup[event.track.value as string] = {
            pos: getFirstKeyframeVec3(event.animate.position as RawKeyframesVec3),
            rot: getFirstKeyframeVec3(event.animate.rotation as RawKeyframesVec3),
            scale: getFirstKeyframeVec3(event.animate.scale as RawKeyframesVec3)
        }
    }],
    ["outro", outroTime]
])

// For some reason ModelScene isn't hiding objects like it should..
// I'll look into this eventually but for now I'll do it manually ig.
const getPieceTrack = (trackID: number, group: string, index: number) =>
    `modelScene${trackID}_${group}_${index}`

Object.keys(scene.objectInfo).forEach(group => {
    if (group.includes("shockwave")) return;
    const objectInfo = scene.objectInfo[group];
    const oldAmount = objectInfo.perSwitch[382.49966];
    const newAmount = objectInfo.perSwitch[outroTime];
    for (let i = newAmount; i < oldAmount; i++) {
        const track = group.includes("eye") || group.includes("undefined")
            ? getPieceTrack(scene.trackID, group, i) : group;
        animTrack = new CustomEvent(outroTime).animateTrack(track);
        animTrack.animate.position = "yeet";
        animTrack.push();
    }
})

map.rawEnvironment.forEach(x => {
    const lookup = posLookup[x.track];
    if (lookup) {
        x.position = lookup.pos;
        x.rotation = lookup.rot;
        x.scale = lookup.scale;
    }
})

env.lightID = 1000;

const textScene = new ModelScene(env, BLOOM_LIGHT.SCALE);
textScene.animate([
    ["vis_0", 0],
    ["vis_50", 300],
    ["vis_100", 382],
    ["lone", 635]
])

const textIDs: number[] = [];
for (let i = 0; i < textScene.objectInfo.undefined.max; i++) textIDs.push(i + 1000);

const eyeIDs: number[] = [];
for (let i = 0; i < scene.objectInfo.eye.max; i++) eyeIDs.push(i + 300);

// Eye
const lr = new LightRemapper().type(4).setType(6).setIDs(eyeIDs);
lr.addProcess(x => {
    const event = copy(x);
    event.type = EVENT.CENTER_LASERS;
    event.lightID = [1, 4]
    event.push();
})
lr.multiplyColor(0, 400).run();

// Text
new LightRemapper().type(7).setType(6).setIDs(textIDs).multiplyColor(0.005, 50).run();

let shockPos: Vec3 = [0, 0, 0];

map.animateTracks(arr => {
    for (let i = 0; i < arr.length; i++) {
        const x = arr[i];
        if (x.track.value === "shockwave") {
            shockPos = x.animate.position as Vec3;
            arr.splice(i, 1);
        }
    }
})

const shockDur = 5;
const shockDist = 600;

map.events.forEach(x => {
    if (x.type === 1) {
        const shockwaveIDs: number[] = [];

        for (let i = 1; i <= shockwaveAmount; i++) {
            shockwaveIDs.push(i + 399);

            const track = `shockwave${i}`;
            const angle = (360 / shockwaveAmount) * i;
            const rot: Vec3 = [0, angle, 0];
            const size = shockDist * Math.tan(Math.PI / (shockwaveAmount)) * 0.6;
            const endPos = arrAdd(shockPos, rotatePoint(rot, [0, 0, shockDist])) as Vec3;
            animTrack = new CustomEvent(x.time).animateTrack(track, shockDur);
            animTrack.animate.rotation = [0, angle, 90];
            animTrack.animate.position = [
                [...shockPos, 0],
                [endPos[0], endPos[1], endPos[2], 1, "easeOutExpo"]
            ]
            animTrack.animate.scale = [
                [1, 1, 1, 0],
                [1, size, 1, 1, "easeOutExpo"]
            ]
            animTrack.push();
        }

        x.value = 7;
        x.lightID = shockwaveIDs;
    }
})

//! Export
map.require("Chroma");
map.require("Noodle Extensions", false)
map.rawSettings = PRESET.CHROMA_SETTINGS;
map.settings.mirrorQuality = "HIGH";
map.settings.smoke = true;
map.settings.sfxVolume = 0;
map.settings.noHud = true;
map.notes.forEach(x => {
    x.spawnEffect = false;
})
map.save();
exportZip(["ExpertPlusLawless.dat"])