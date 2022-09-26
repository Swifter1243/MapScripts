// deno-lint-ignore no-unused-vars
import { AnimationInternals, CustomEvent, CustomEventInternals, debugObject, Difficulty, EASE, Environment, ENV_NAMES, EVENT, Event, exportZip, Geometry, GEO_SHADER, GEO_TYPE, info, KeyframesLinear, LightRemapper, LOOKUP, ModelScene, Note, PRESET, Regex, SETTINGS, transferVisuals, Vec3, Wall } from "https://deno.land/x/remapper@2.0.2/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless.dat", "ExpertPlusStandard.dat");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

//! Fog
new CustomEvent().assignFogTrack("fog").push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}

fogAttentuation(0, [1 / 10000]);
fogAttentuation(9, [1 / 100000]);
fogAttentuation(135, [[1 / 100000, 0], [1 / 10000, 1, EASE.IN_OUT_EXPO]], 4);
fogAttentuation(185, [1 / 100000]);
fogAttentuation(248, [1 / 1000]);
fogAttentuation(249, [1 / 100000]);
fogAttentuation(311, [[1 / 100000, 0], [1 / 10000, 1, EASE.IN_OUT_EXPO]], 4);

//! Environment

// Removal
function remove(ids: string[], regex = false) {
    env = new Environment(undefined, regex ? LOOKUP.REGEX : undefined);
    env.active = false;

    ids.forEach(x => {
        env.id = x;
        env.push();
    })
}

// Contains
remove([
    "Building",
    "LightLinesTrackLaneRing",
    "TrackMirror",
    "TrackConstruction",
    "GreenDayCity",
    "GlowLineL",
    "RectangleFakeGlow",
    "DustPS"
])

// Model
const smokeSize = 0.04;
const solidLightWidth = 50;

const SOLID_LIGHT = {
    ID: "GlowLineR$",
    SCALE: <Vec3>[solidLightWidth, 0.002, solidLightWidth]
}

const BLOOM_LIGHT = {
    ID: "FrontLight$",
    SCALE: <Vec3>[1, 0.001, 1],
    ANCHOR: <Vec3>[0, -0.5, 0]
}

env = new Environment("BigSmokePS$", LOOKUP.REGEX);
env.track = "smoke";
env.active = true;
env.push();

const solidLights: string[] = []
const bloomLights: string[] = ["horizon"]

// Solid
env = new Environment(SOLID_LIGHT.ID, LOOKUP.REGEX);
env.duplicate = 1;
env.lightID = 200;

for (let i = 1; i <= 22; i++) {
    env.track = `solidlaser${i}`;
    solidLights.push(env.track);
    env.push();
}

// Bloom
env = new Environment(BLOOM_LIGHT.ID, LOOKUP.REGEX);
env.duplicate = 1;
env.lightID = 100;
env.track = "horizon";
env.push();

//! Lights
/*
? HORIZON: CENTER LIGHT ID 1
? ORGANIC LASERS: RING ID 1 - 9
? UNIFORM LASERS: RING ID 10 - 17
? BIG BEAMS: RING ID 18 - 20 
*/

// Horizon
new LightRemapper(EVENT.CENTER_LASERS, 1).multiplyColor(5).run(false, x => { x.lightID = 100 });
// Solid Lasers
new LightRemapper(EVENT.RING_LIGHTS, [1, 60]).setType(EVENT.CENTER_LASERS).normalizeLinear(1, 2).addToEnd(199).run(false, x => {
    if (typeof x.lightID !== "number") x.lightID = x.lightID[0];
})

//! Model

const scene = new ModelScene(new Geometry(undefined, "standard"));
scene.assignObjects("smoke", [smokeSize, smokeSize, smokeSize]);
scene.assignObjects(solidLights, SOLID_LIGHT.SCALE);
scene.assignObjects(bloomLights, BLOOM_LIGHT.SCALE, BLOOM_LIGHT.ANCHOR);
scene.static("env");

//! Export
function exportMap(diff: Difficulty) {
    diff.geoMaterials["standard"] = {
        _shader: GEO_SHADER.STANDARD
    }

    diff.require("Chroma");
    diff.require("Noodle Extensions", false)
    diff.settings = PRESET.CHROMA_SETTINGS;
    diff.setSetting(SETTINGS.SMOKE.VALUE, SETTINGS.SMOKE.ON);
    diff.setSetting(SETTINGS.MIRROR_QUALITY.VALUE, SETTINGS.MIRROR_QUALITY.OFF);
    diff.setSetting(SETTINGS.NO_HUD, true);
    diff.notes.forEach(x => {
        x.spawnEffect = false;
    })
}
exportMap(map);
map.save();
transferVisuals(["ExpertStandard.dat", "HardStandard.dat", "NormalStandard.dat", "EasyStandard.dat"], x => { exportMap(x) });
exportZip(["ExpertPlusLawless.dat"]);