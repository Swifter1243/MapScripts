import { CustomEvent, CustomEventInternals, Difficulty, Environment, EVENT, exportZip, Geometry, KeyframesLinear, LightRemapper, ModelScene, PRESET, Regex, rotatePoint, Vec3 } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless.dat", "HardStandard.dat");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

const dayStart = 6;
const dayEnd = 518
const dayDur = dayEnd - dayStart;

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

fogAttentuation(dayStart, [[1 / 10000, 0], [1 / 40000, 1, "easeOutQuad"]], dayDur);
fogAttentuation(582 - 0.5, [[1 / 40000, 0], [1 / 4000, 1, "easeInExpo"]], 1);
fogAttentuation(590, [[1 / 4000, 0], [1 / 100, 1, "easeInQuad"]], 7);

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
    "Waterfall",
    "Clouds",
    "RectangleFakeGlow"
])

env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

const sunSize = 30;

env = new Environment("Sun$", "Regex");
env.scale = [1, 1, 1].map(x => x * sunSize) as Vec3;
env.track = "sun"
env.push();

const sunPos = [0, -200, 3000] as Vec3;
const sunAngle = rotatePoint([-20, 0, 0], sunPos);

animTrack = new CustomEvent(dayStart).animateTrack("sun", dayDur)
animTrack.animate.position = [[...sunAngle, 0], [...sunPos, 1]];
animTrack.push();

env = new Environment(new Regex("Sun").separate().add("NeonTube").vary(2).end(), "Regex")
env.scale = [7, 2, 1].map(x => x * 20 / sunSize) as Vec3;
env.push();

env = new Environment("Rain$", "Regex");
env.duplicate = 1;
env.lightID = 100;
env.position = [0, 1000, 500]
env.rotation = [0, 0, 5];
env.scale = [1, 2, 1].map(x => x * 40) as Vec3
env.push();

// Model

const baseLightID = (vary = 0) => new Regex().add("LightRailingSegment").vary(vary).separate().add("NeonTubeDirectionalL").string;

const BLOOM_LIGHT = {
    ID: baseLightID() + "$",
    SCALE: <Vec3>[1, 0.2, 1]
}

env = new Environment(new Regex().add(baseLightID()).separate().add("BoxLight").end(), "Regex");
env.active = false;
env.push();

//! Lights

const lights = 16;

/*
? RAIN: WATER 1 ID 1
? HORIZON: WATER 1 ID 2
? SUN: WATER 1 ID 3
? SUN FLARE: WATER 1 ID 4
? SOLID LASERS: LEFT SUNBEAMS ID 1-16
*/

new LightRemapper().IDs([1]).type(1).setIDs(100).multiplyColor(1, 4).setType(3).run(); // Rain
new LightRemapper().IDs([2]).type(1).setIDs(101).multiplyColor(4 * 0.3).run(); // Horizon
new LightRemapper().IDs([3]).type(1).setIDs(1).setType(EVENT.CENTER_LASERS).run(); // Sun
new LightRemapper().IDs([4]).type(1).setIDs(4).setType(EVENT.CENTER_LASERS).multiplyColor(3).run(); // Sun Flare
new LightRemapper().range([1, lights]).type(2).addToEnd(199).setType(6).multiplyColor(0.5, 3).run(); // Solid Lasers

//! Model

const fillArr = (base: string, length: number) => Array.from({ length: length }, (_, i) => base + (i + 1));

map.geoMaterials["cube"] = {
    _shader: "Standard"
}

const scene = new ModelScene(new Geometry(undefined, "cube"));

scene.addPrimaryGroups("cloud", new Geometry("Sphere", "cube"));

env = new Environment(BLOOM_LIGHT.ID, "Regex");
env.lightID = 101;
scene.addPrimaryGroups("horizon", env, BLOOM_LIGHT.SCALE);

env = new Environment(baseLightID(1) + "$", "Regex");
env.lightID = 200;
scene.addPrimaryGroups(fillArr("laser", lights), env, BLOOM_LIGHT.SCALE);

scene.static("env");

// Export
map.notes.forEach(x => {
    x.spawnEffect = false;
})
map.rawSettings = PRESET.CHROMA_SETTINGS;
map.settings.mirrorQuality = "OFF";
map.settings.noHud = true;

map.suggestions = [];
map.requirements = ["Chroma"];
map.save();
exportZip(["ExpertPlusLawless"]);