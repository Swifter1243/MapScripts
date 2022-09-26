// deno-lint-ignore no-unused-vars
import { AnimationInternals, CustomEvent, CustomEventInternals, debugObject, Difficulty, Environment, EVENT, Event, exportZip, Geometry, info, KeyframesLinear, KeyframesVec3, LightRemapper, ModelScene, Note, PRESET, Regex, RMLog, settings, transferVisuals, Vec3, Wall } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless", "HardStandard");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

//! Fog
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog");
animTrack.animate.startY = [1000];
animTrack.animate.height = [-400];
animTrack.push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}

fogAttentuation(0, [1 / 10000]);
fogAttentuation(169, [1 / 800000]);

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
    "Cloud"
])

env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

env = new Environment("Waterfall$", "Regex");
env.scale = [150, 1, 3];
env.position = [0, 0, -50]
env.push();

env = new Environment("Rain$", "Regex");
env.duplicate = 1;
env.lightID = 100;
env.position = [0, 20, 10]
env.push();

env = new Environment("BigSmokePS$", "Regex");
env.track = "smoke";
env.active = true;
env.push();

// Model 

const smokeSize = 0.04;

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

trackPush(env, "horizon", lights);

env.lightID = 200;
for (let i = 1; i <= 6; i++) trackPush(env, `laser${i}`, lights);

env.id = baseLightID(1) + "$";

for (let i = 7; i <= 8; i++) trackPush(env, `laser${i}`, lights);

//! Lights

/*
? HORIZON: SUN
? ROTATING LASERS: LEFT AND RIGHT LASERS
? SOLID LASERS: LEFT SUNBEAMS ID 1-8
*/

new Event(5).backLasers().on([1, 1, 1, 1], 100).push(); // Rain
new Event(297).backLasers().off(100).push(); // Rain

new LightRemapper().type(2).range([1, 6]).setType(1).addToEnd(199).multiplyColor(1, 4).run(); // Bloom Lasers
new LightRemapper().type(2).range([7, 8]).setType(6).addToEnd(199 - 6).multiplyColor(1, 4).run(); // Solid Lasers
new LightRemapper().type(4).setType(1).setIDs(101).multiplyColor(1).run() // Horizon
const lrm = new LightRemapper().multiplyColor(5);
lrm.addCondition(x => x.type === 10 || x.type === 11);
lrm.run();

//! Model

map.geoMaterials["cube"] = {
    _shader: "Standard"
}

const scene = new ModelScene(new Geometry(undefined, "cube"));
scene.assignObjects(rotatingLights, undefined, [0, 1.75, 2]);
scene.assignObjects(lights, BLOOM_LIGHT.SCALE);
scene.assignObjects("smoke", [smokeSize, smokeSize, smokeSize]);
scene.static("env");

// Export
map.require("Chroma");
map.require("Noodle Extensions", false)
map.rawSettings = PRESET.CHROMA_SETTINGS;
map.settings.mirrorQuality = "HIGH";
map.settings.smoke = true;
map.settings.noHud = true;
map.notes.forEach(x => {
    x.spawnEffect = false;
})
map.save();
exportZip(["ExpertPlusLawless"])