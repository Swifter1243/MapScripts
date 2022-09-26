// deno-lint-ignore no-unused-vars
import { AnimationInternals, CustomEvent, CustomEventInternals, debugObject, Difficulty, Environment, EVENT, Event, exportZip, Geometry, info, KeyframesLinear, KeyframesVec3, LightRemapper, ModelScene, Note, PRESET, Regex, RMLog, transferVisuals, Vec3, Wall } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless.dat", "ExpertPlusStandard.dat");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

//! Fog
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog");
animTrack.animate.startY = [-69420]
animTrack.push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}

// time, duration
const pullBacks: [number, number][] = [
    [643.787, 1],
    [706, 2],
    [769.2, 2]
]
const cloudSwitches: [number, KeyframesVec3][] = [];

fogAttentuation(0, [1 / 10000]);
fogAttentuation(579.6, [1 / 100000]);

pullBacks.forEach(x => {
    const time = x[0];
    const duration = x[1];
    fogAttentuation(time, [1 / 10000]);
    fogAttentuation(time + duration, [1 / 100000]);
    cloudSwitches.push([time, [0, -69420, 0]]);
    cloudSwitches.push([time + duration, [0, 0, 0]]);
})

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
    "Mirror"
])

env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

env = new Environment("Waterfall$", "Regex");
env.scale = [100, 1, 3];
env.position = [0, 0, -50]
env.push();

env = new Environment("Clouds");
env.scale = [3, 3, 0.7].map(x => x * 30) as Vec3;
env.position = [0, -69420, 0]
env.track = "clouds";
env.push();

cloudSwitches.push([579.6, [0, 0, 0]])

cloudSwitches.forEach(x => {
    animTrack = new CustomEvent(x[0]).animateTrack("clouds");
    animTrack.animate.position = x[1]
    animTrack.push();
})

env = new Environment("Sun$", "Regex");
env.scale = [1, 1, 1].map(x => x * 10) as Vec3;
env.position = [0, 10, 1000]
env.track = "sun"
env.push();

animTrack = new CustomEvent(579.6).animateTrack("sun");
animTrack.animate.scale = [9, 6, 1].map(x => x * 20) as Vec3;
animTrack.animate.position = [0, 0, 3000]
animTrack.push();

env = new Environment("Rain$", "Regex");
env.duplicate = 1;
env.lightID = 100;
env.position = [0, 20, 10]
env.rotation = [0, 0, 5];
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

for (let i = 1; i <= 8; i++) trackPush(env, `solidLaser${i}`, lights);

//! Lights

/*
? SUN: CENTER LASERS ID 1
? ROTATING LASERS: LEFT AND RIGHT LASERS
? BLOOM LASERS: WATER 2 ID 1-4
? SOLID LASERS: LEFT SUNBEAMS ID 1-8
*/

new Event(6).backLasers().on([1, 1, 1, 1], 100).push();
new Event(958.8).backLasers().on([0, 0, 0, 0], 100).push();

new LightRemapper().type(EVENT.CENTER_LASERS).range(1).setIDs(4).multiplyColor(4).run();
new LightRemapper().type(6).range([1, 4]).setType(1).addToEnd(100).run();
new LightRemapper().type(2).range([1, 8]).setType(6).addToEnd(199).run();

//! Model

map.geoMaterials["cube"] = {
    _shader: "Standard"
}

const scene = new ModelScene(new Geometry(undefined, "cube"));
scene.assignObjects(rotatingLights, undefined, [0, 1.75, 2]);
scene.assignObjects(lights, BLOOM_LIGHT.SCALE);
scene.static("env");

// Export
map.require("Chroma");
map.require("Noodle Extensions", false)
map.rawSettings = PRESET.CHROMA_SETTINGS;
map.settings.mirrorQuality = "HIGH";
map.settings.smoke = false;
map.notes.forEach(x => {
    x.spawnEffect = false;
})
map.save();
exportZip(["ExpertPlusLawless.dat"])
