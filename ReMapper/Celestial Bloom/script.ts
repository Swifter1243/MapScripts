//? Made in ReMapper 1.0.11

import { activeDiff, BlenderEnvironment, CustomEvent, CustomEventInternals, Difficulty, EASE, Environment, EVENT, exportZip, lerpEasing, LightRemapper, LOOKUP, Note, PRESET, Regex, rotatePoint, SETTINGS, transferVisuals, Vec3 } from "swifter_remapper";
let map = new Difficulty("ExpertPlusStandard.dat");
let animTrack: CustomEventInternals.AnimateTrack;
let env: Environment;
let blenderEnv: BlenderEnvironment;

/* Lights
CENTER LIGHTS: Middle Lights
BIG RINGS 1-6: Main Swirl
BIG RINGS 7-12: Alt Swirl
LEFT LASERS: Top Swirl
RIGHT LASERS: Bottom Swirl
BACK LASERS: Simple Lasers
*/

//! Aurora Blender
// Making lightID consistent in auroras (sorting by Y value)
let dataTrackSorts = ["mainSwirl", "altSwirl"];
dataTrackSorts.forEach(track => {
    let filtered = map.notes.filter(x => x.track.has(track));
    filtered.sort((a, b) => a.animate.definitePosition[0][1] - b.animate.definitePosition[0][1]);
    filtered.forEach((x, i) => x.time = i);
})
map.notes.sort((a, b) => a.time - b.time);

// Assigning auroras
let auroraSecondID = new Regex().add("Aurora").seperate().add("AuroraSecondary").end().string;
blenderEnv = new BlenderEnvironment([900, 200, 1000], [0, -0.25, 0], auroraSecondID, LOOKUP.REGEX);

blenderEnv.static("mainSwirl", x => { x.lightID = 100 });
blenderEnv.static("altSwirl", x => { x.lightID = 100 });

// Assigning top swirl
for (let i = 1; i <= 6; i++) {
    env = new Environment(auroraSecondID, LOOKUP.REGEX);
    env.duplicate = 1;
    env.trackSet = `topLight${i}`;
    env.lightID = 100;
    env.push();

    blenderEnv.assignObjects([env.track.value as string], [900, 200, 1000], [0, -0.25, 0]);
}

// Assigning bottom swirl
for (let i = 1; i <= 6; i++) {
    env = new Environment(auroraSecondID, LOOKUP.REGEX);
    env.duplicate = 1;
    env.trackSet = `bottomLight${i}`;
    env.lightID = 100;
    env.push();

    blenderEnv.assignObjects([env.track.value as string], [900, 200, 1000], [0, -0.25, 0]);
}

// This just spawns only the swirls. lol
blenderEnv.static("");

// Spawning lasers
blenderEnv = new BlenderEnvironment([900, 200, 1000], [0, -0.25, 0], auroraSecondID, LOOKUP.REGEX);
blenderEnv.static("lasers", x => { x.lightID = 100 });

//! Environment stuff
// Removal (contains)
env = new Environment("Logo", LOOKUP.CONTAINS);
env.active = false;
env.push();
env.id = "Tube";
env.push();
env.id = "Runway";
env.push();
env.id = "TeslaTower";
env.push();
env.id = "RectangleFakeGlow";
env.push();

// Removal (regex)
env.lookupMethod = LOOKUP.REGEX;
env.id = new Regex().add("Environment").seperate().add("Construction").end().string;
env.push();
env.id = auroraSecondID;
env.push();

// Positioning middle lights
env = new Environment("FrontLasers$", LOOKUP.REGEX);
env.scale = [1 / 10000, 1 / 10000, 1 / 10000];
env.position = [0, 5, 120];
env.push();

// Grid
let scale = 70;

let gridSpacing = 300;
let gridSize = gridSpacing * 7;

let startZ = 200;
let depth = 5000;
let Zspacing = 500;

// I'm basically faking SW data lmfao
let note = new Note();
let data: any = {};
for (let x = -gridSize; x <= gridSize; x += gridSpacing) for (let y = -gridSize; y <= gridSize; y += gridSpacing) for (let z = startZ; z <= depth; z += Zspacing) {
    let position: Vec3 = [x + (gridSpacing / 2), y + (gridSpacing / 2), z];
    let rotation: Vec3 = [0, 0, lerpEasing(EASE.IN_SINE, z / (depth - startZ)) * 180 * (1 - Math.abs(x / gridSize)) * (1 - Math.abs(y / gridSize))];
    position = rotatePoint(rotation, position) as Vec3;

    data._definitePosition = [[...position, 0]];
    data._localRotation = [[...rotation, 0]];
    data._scale = [[scale, scale, scale, 0]]

    note.animation = data;
    note.trackSet = "env";
    note.push();
}

// Spawning in cubes based on the grid data I made
blenderEnv = new BlenderEnvironment([16, 7 / 10, 14 / 10], [0, -0.5, -0.5], "BackCube$", LOOKUP.REGEX);
blenderEnv.static("env");

// Hiding the original cube
env = new Environment("BackCube$", LOOKUP.REGEX);
env.active = false;
env.push();

//! Fog
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog");
animTrack.animate.startY = [-69420];
animTrack.animate.attenuation = [1 / 200000];
animTrack.push();

//! Main and Alt Swirl (Big Rings)
let alpha = 3;
// All Lights
map.events.forEach(x => {
    if (x.lightID === undefined && x.type === EVENT.RING_LIGHTS) {
        if (x.color) x.color[3] *= alpha;
        x.lightID = [];
        for (let i = 100; i <= 111; i++) x.lightID.push(i);
    }
});
// 1-12 (100-111)
new LightRemapper(EVENT.RING_LIGHTS, [1, 48]).normalizeLinear(1, 4).addToEnd(99).multiplyColor(1, alpha).run(false, x => {
    x.lightID = x.lightID[0]
    let oldID = x.lightID;

    // Rearranging lightIDs to be more intuitive
    if (oldID === 3 + 99) x.lightID = 4 + 99;
    if (oldID === 4 + 99) x.lightID = 6 + 99;
    if (oldID === 6 + 99) x.lightID = 3 + 99;
    if (oldID === 7 + 99) x.lightID = 8 + 99;
    if (oldID === 8 + 99) x.lightID = 7 + 99;
    if (oldID === 10 + 99) x.lightID = 11 + 99;
    if (oldID === 11 + 99) x.lightID = 12 + 99;
    if (oldID === 12 + 99) x.lightID = 10 + 99;
});

//! Top Lights (Left Lasers)
alpha = 4;
// All Lights
map.events.forEach(x => {
    if (x.lightID === undefined && x.type === EVENT.LEFT_LASERS) {
        if (x.color) x.color[3] *= alpha;
        x.lightID = [];
        x.type = EVENT.RING_LIGHTS;
        for (let i = 112; i <= 117; i++) x.lightID.push(i);
    }
});
// 1-6 (112-117)
new LightRemapper(EVENT.LEFT_LASERS, [1, 7]).addToEnd(111).multiplyColor(1, alpha).setType(EVENT.RING_LIGHTS).run(false, x => { if (typeof x.lightID === "object") x.lightID = x.lightID[0] });

//! Bottom Lights (Right Lasers)
// All Lights
map.events.forEach(x => {
    if (x.lightID === undefined && x.type === EVENT.RIGHT_LASERS) {
        if (x.color) x.color[3] *= alpha;
        x.lightID = [];
        x.type = EVENT.RING_LIGHTS;
        for (let i = 118; i <= 123; i++) x.lightID.push(i);
    }
});
// 1-6 (118-123)
new LightRemapper(EVENT.RIGHT_LASERS, [1, 7]).addToEnd(117).multiplyColor(1, alpha).setType(EVENT.RING_LIGHTS).run(false, x => { if (typeof x.lightID === "object") x.lightID = x.lightID[0] });

//! Lasers (Back Lights)
alpha = 6;
// All Lights
map.events.forEach(x => {
    if (x.lightID === undefined && x.type === EVENT.BACK_LASERS) {
        x.type = EVENT.RING_LIGHTS
        if (x.color) x.color[3] *= alpha;
        x.lightID = [];
        for (let i = 124; i <= 128; i++) x.lightID.push(i);
    }
});
// 1-5 (124-128)
new LightRemapper(EVENT.BACK_LASERS, [1, 10]).normalizeLinear(1, 2).addToEnd(123).multiplyColor(1, alpha).setType(EVENT.RING_LIGHTS).run(false, x => { x.lightID = x.lightID[0] });

//! Lasers (Back Lights)
alpha = 4;
// All Lights
map.events.forEach(x => {
    if (x.type === EVENT.CENTER_LASERS && x.color) {
        x.color[0] *= 3;
        x.color[1] *= 3;
        x.color[2] *= 3;
        x.color[3] *= alpha;
    }
});

// Output
function exportMap(diff: Difficulty) {
    diff.require("Chroma");
    diff.require("Noodle Extensions", false)
    diff.settings = PRESET.CHROMA_SETTINGS;
    diff.setSetting(SETTINGS.NO_HUD, true);
    diff.setSetting(SETTINGS.MAX_SHOCKWAVE_PARTICLES, 0);
    diff.setSetting(SETTINGS.NO_FAIL, true);
    diff.colorLeft = [0.422, 0.422, 0.422];
    diff.colorRight = [0.281, 0.687, 0.944];
    diff.notes.forEach(x => {
        x.spawnEffect = false;
    })
}
exportMap(activeDiff);
transferVisuals(["ExpertStandard.dat", "HardStandard.dat"], x => { exportMap(x) });
map.save();
exportZip(["ExpertPlusStandard_Old.dat"]);
