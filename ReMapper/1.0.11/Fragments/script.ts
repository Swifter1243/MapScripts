//? Made in ReMapper 1.0.11

import { activeDiff, Animation, AnimationInternals, arrAdd, BlenderEnvironment, complexifyArray, copy, CustomEvent, Difficulty, ENV, Environment, EVENT, Event, exportZip, LightRemapper, LOOKUP, PRESET, Regex, rotatePoint, SETTINGS, transferVisuals } from "swifter_remapper";
let map = new Difficulty("ExpertPlusStandard.dat");
let env: Environment;

/*
LEFT LASER 1: Main beam
LEFT LASER 2-9, RIGHT 1-9: Beam swirl
CENTER LIGHT 1 - Horizon top
CENTER LIGHT 2 - Horizon bottom
RING LIGHTS 1-8 (open alt + p) - Scattered lasers
BACK LIGHTS - Middle crossing lasers
*/

//! Environment stuff
// Remove with contains
env = new Environment("PillarTrackLaneRing", LOOKUP.CONTAINS);
env.active = false;
env.push();
env.id = "SideLaser";
env.push();
env.id = "CloudsGenerator";
env.push();
env.id = "DirectionalLight";
env.push();

// Remove with regex
env.lookupMethod = LOOKUP.REGEX;
env.id = "Construction$";
env.push();
env.id = "LowCloudsGenerator$";
env.push();
env.id = "HighCloudsGenerator$";
env.push();
env.id = "RectangleFakeGlow$";
env.push();

// Move outta sight
env = new Environment("GlowLine", LOOKUP.CONTAINS);
env.position = [0, -69420, 0];
env.push();
env.id = "BottomGlow";
env.push();

// Mirror stuff
env = new Environment("", LOOKUP.REGEX);
env.id = new Regex().add("TrackMirror").end().string;
env.scale = [4000, 1, 1.5];
env.position = [-1450, 0, -200];
env.push();

// Fog stuff
new CustomEvent().assignFogTrack("fog").push();
let event = new CustomEvent().animateTrack("fog");
event.animate.startY = [-420];
event.animate.attenuation = [0.000001];
event.animate.height = [200];
event.push();

//! Main Light
let lightZ = 100;
let lightY = 5;

env = new Environment("MagicDoorSprite$", LOOKUP.REGEX);
env.scale = [10, 1 / 10000, 1]
env.position = [0, lightY, lightZ]
env.push();

env = new Environment("", LOOKUP.REGEX);
env.id = new Regex().add("MagicDoorSprite").seperate().add("Bloom(L|R)").end().string;
env.scale = [1, 10000, 1];
env.rotation = [0, 0, 90]
env.push();

env = new Environment("", LOOKUP.REGEX);
env.id = new Regex().add("MagicDoorSprite").seperate().add("BloomR").end().string;
env.position = [0, lightY + 5, lightZ];
env.push();

//! Sky beam
let skyBeamZ = 600;
let laserNum = 0;
for (let i = 0; i <= 8; i++) {
    for (let s = -1; s <= 1; s += 2) {
        let pair = new Regex().add(i % 2 === 0 ? "PillarPair" : "SmallPillarPair").vary(Math.floor(i / 2)).string;
        let side = s === -1 ? "L" : "R";
        let id = new Regex().start().add(pair).seperate().add(`Pillar${side}`).string;

        // Disabling the pillar that the lasers are on
        env = new Environment(undefined, LOOKUP.REGEX);
        env.id = new Regex().add(pair).seperate().add(`Pillar${side}`).seperate().add("Pillar").end().string;
        env.active = false;
        env.push();

        // Disabling the reflector and laser light (weird spotlight things)
        env.id = new Regex().add(id).seperate().add(`RotationBase${side}`).seperate().add("(Reflector$|LaserLight)").string;
        env.push();

        // Disabling the laser light on the inner rings too
        env.id = new Regex().add(id).seperate().add("LaserLight").string;
        env.push();

        // Repositioning the lasers
        env = new Environment(undefined, LOOKUP.REGEX);
        env.id = new Regex().add(id).seperate().add(`RotationBase${side}`).seperate().add(`Laser${side}H$`).string;
        // Main beam
        if (i === 0 && s === -1) {
            env.position = [0, 0, skyBeamZ];
            env.rotation = [0, 0, 0];
            env.scale = [40, 1, 40];
        }
        // Beam swirls
        else {
            let beamNum = i - 1;
            if (s === 1) beamNum += 9;
            const rotation = (beamNum * 40) % 360;
            const distMul = (16 - beamNum) / 16 * 2
            const sizeMul = 0.5;

            env.position = arrAdd([0, beamNum * 80 * sizeMul, skyBeamZ], rotatePoint([0, rotation, 0], [0, 0, 20 * distMul * sizeMul]));
            env.rotation = [9.2 * distMul, (rotation + 115) % 360, 0];
            env.scale = [15, 1 / 49.5 * sizeMul, 15];
        }
        env.push();

        // Assigning tracks to the lasers
        if (i % 2 === 1) {
            env = new Environment(undefined, LOOKUP.REGEX);
            env.id = new Regex().add(id).seperate().add(`Laser${side}`).end().string;
            laserNum++
            env.trackSet = `laser${laserNum}`;
            env.push();
        }
    }
}

//! Blender stuff
let blenderEnv = new BlenderEnvironment(ENV.BTS.PILLAR.SCALE, ENV.BTS.PILLAR.ANCHOR, ENV.BTS.PILLAR.ID, LOOKUP.REGEX);

// Assigning custom laser positions from blender
let lasers = [];
for (let i = 1; i <= 8; i++) lasers.push(`laser${i}`);
blenderEnv.assignObjects(lasers, ENV.BTS.SOLID_LASER.SCALE, ENV.BTS.SOLID_LASER.ANCHOR);

// Spawning animation at sky beam impact
blenderEnv.animate([
    ["env", 702, 30]
])

// Setting lasers to position at time 0
map.customEvents.forEach(x => {
    if (x.data._track && x.data._track.includes("laser")) x.time = 0;
})

// Initializing environment positions, since the animation is later
// I should really add a thing for this lmao
map.environment.forEach(x => {
    if (x.track && (x.track.value as string).includes("blenderEnv0_")) {
        let anim = map.customEvents.find(y => y.data._track && y.data._track === x.track.value);
        if (anim !== undefined) {
            x.position = complexifyArray(copy(anim.data._position))[0] as number[];
            x.rotation = complexifyArray(copy(anim.data._rotation))[0] as number[];
            x.scale = complexifyArray(copy(anim.data._scale))[0] as number[];
            x.position.pop();
            x.rotation.pop();
            x.scale.pop();
        }
        x.active = true;
    }
})

// Middle crossing
for (let s = -1; s <= 1; s += 2) {
    env = new Environment(undefined, LOOKUP.REGEX);
    env.id = ENV.BTS.SOLID_LASER.ID;
    env.duplicate = 1;
    env.lightID = 100;
    env.position = [s * 50, -5, 300];
    env.rotation = [0, 0, s * 50];
    env.scale = [30, 1, 30];
    env.push();
}

map.events.forEach(x => {
    if (x.type === EVENT.BACK_LASERS) {
        x.lightID = [100, 101];
        x.type = EVENT.RING_LIGHTS;
    }
})

// Horizon lights
new LightRemapper(EVENT.CENTER_LASERS, 2).setLightID(3).setType(EVENT.BACK_LASERS).multiplyColor(1, 1 / 5).run();
new LightRemapper(EVENT.CENTER_LASERS, 1).setLightID(2).setType(EVENT.BACK_LASERS).multiplyColor(1, 1 / 50).run();

// Scattered lasers
map.events.forEach(x => { if (x.type === EVENT.RING_LIGHTS && x.color) if (x.color[3]) x.color[3] *= 0.5 })

new Event().backLasers().on([0, 0, 0, 0]).push();

// Output
function exportMap(diff: Difficulty) {
    diff.require("Chroma");
    diff.require("Noodle Extensions", false)
    diff.settings = PRESET.CHROMA_SETTINGS;
    diff.setSetting(SETTINGS.MIRROR_QUALITY.VALUE, SETTINGS.MIRROR_QUALITY.HIGH);
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
