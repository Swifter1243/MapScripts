// deno-lint-ignore no-unused-vars
import { adjustFog, Arc, Chain, arrAdd, arrMul, cacheData, ComplexKeyframesLinear, ComplexKeyframesVec3, CustomEvent, CustomEventInternals, Difficulty, EASE, Environment, Event, exportZip, Geometry, info, jsonSet, KeyframesLinear, KeyframesVec3, lerp, lerpEasing, lerpRotation, LightRemapper, ModelObject, ModelScene, Note, PRESET, rand, RawKeyframesVec3, Regex, rotatePoint, settings, transferVisuals, Vec3, EVENTGROUP } from "https://deno.land/x/remapper@3.1.2/src/mod.ts"

const map = new Difficulty("ExpertPlusNoArrows", "ExpertPlusStandard");
let env: Environment;
let geo: Geometry;

//! FOG

adjustFog(x => {
    x.startY = -69420;
    x.attenuation = 1 / 20000;
})

//! ENVIRONMENT

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
    "Clouds",
    "Mirror"
])

// Move lights down
env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

// Create ocean
env = new Environment("Waterfall", "EndsWith");
env.scale = [100, 1, 3];
env.position = [0, 0, -50]
env.push();

// Lights
const scene = new ModelScene(new Geometry());

const trackArr = (base: string, length: number) => Array.from({ length: length }, (_, i) => base + (i + 1));
const fillArr = (base: number, length: number) => Array.from({ length: length }, (_, i) => (i + base));
function trackPush(env: Environment, track: string, pushArr: string[]) {
    pushArr.push(track);
    env.track.value = track;
    env.push();
}

// Rotating lasers
const rotatingLights: string[] = [];

for (let s = -1; s <= 1; s += 2) for (let l = 0; l <= 8; l++) {
    const side = s === -1 ? "L" : "R";
    const ID = new Regex("BottomPairLasers").vary(l).separate().add(`Pillar${side}`).end();

    env = new Environment(ID, "Regex");
    const track = `rotating_${side}_${l}`;
    trackPush(env, track, rotatingLights);
}

scene.assignObjects(rotatingLights, undefined, [0, 1.75, 2]);

// Lightning
const lightningAmount = 4;
let lightningID = 100;

geo = new Geometry("Cube", {
    shader: "TransparentLight"
});
geo.lightType = 1;
geo.components.TubeBloomPrePassLight = {
    bloomFogIntensityMultiplier: 10,
    colorAlphaMultiplier: 10
}
geo.lightID = lightningID;

scene.addPrimaryGroups(trackArr("lightning", lightningAmount), geo);

// Eyes
const eyeID = 1000;

geo = new Geometry("Sphere", {
    shader: "TransparentLight"
});
geo.lightType = 1;
geo.components.TubeBloomPrePassLight = {
    bloomFogIntensityMultiplier: 1,
    colorAlphaMultiplier: 4
}
geo.lightID = eyeID;

scene.addPrimaryGroups("eyes", geo);

// Horizon
const horizonID = 2000;

geo = new Geometry("Cube", {
    shader: "TransparentLight"
});
geo.lightType = 1;
geo.components.TubeBloomPrePassLight = {
    bloomFogIntensityMultiplier: 0.25,
}
geo.lightID = horizonID;

geo.position = [0, -0.1, 30];
geo.rotation = [0, 0, 90];
geo.scale = [0.0001, 10000, 0.0001];
geo.push();

// Sun
env = new Environment("Sun", "EndsWith");
env.track.value = "sun"
env.push();

env = new Environment(new Regex("Sun").separate().add("NeonTube").vary(2).end(), "Regex")
env.scale = [10, 2, 1] as Vec3;
env.push();

scene.assignObjects("sun", [2, 2, 2]);

// Smoke

env = new Environment("BigSmokePS", "EndsWith");
env.track.value = "smoke";
env.active = true;
env.push();

env.duplicate = 1;
env.track.value = "groundFog";
env.push();

const smokeSize = 0.04;
scene.assignObjects(["smoke", "groundFog"], [smokeSize, smokeSize, smokeSize]);

// Rain

env = new Environment("Rain");
env.position = [0, -69420, 0];
env.push();

const rainID = 3000;

env = new Environment("Rain", "EndsWith");
env.duplicate = 1;
env.active = true;
env.lightType = 1;
env.lightID = rainID;
env.position = [0, 20, 0];
env.rotation = [0, 0, 5];
env.scale = [1.5, 3, 3];
env.push();

//! MODEL

const lightningObjects: Record<number, Geometry[]> = {};
const lightningIDs: Record<number, number[]> = {};
const allLightningIDs: number[] = [];

// Track lightning geometry objects
scene.static("env", x => {
    if (x.track.check(t => t.includes("lightning"))) {
        const track = (x.track.value as string).split("_")[1];
        const number = parseInt(track.substring(track.length - 1));

        if (!lightningObjects[number])
            lightningObjects[number] = [];

        lightningObjects[number].push(x as Geometry);
    }
});

// Generate lightning ID lookups
let lightningIDsAccumulated = 0;

for (let i = 1; i <= lightningAmount; i++) {
    const arr = lightningObjects[i];
    const IDarr = [] as number[];

    arr.forEach((x, i) => {
        const ID = i + lightningIDsAccumulated;
        IDarr.push(ID);
        x.lightID = ID;
    })

    lightningIDs[i] = IDarr;
    lightningIDsAccumulated += arr.length;
    allLightningIDs.push(...IDarr);
}

//! LIGHTS

/*
? SHIP ROTATING LASERS: LEFT LASERS
? SUN: SUN
? EYES: WATER 3
? HORIZON: WATER 2
? LIGHTNING: RIGHT SUNBEAMS 1-4
? RAIN: WATER 4
*/


// Apparently laser rotation speed events don't get automatically fixed when they should be
// I'll have to fix this later
map.events.forEach(x => {
    if (x.type === EVENTGROUP.LEFT_ROTATING && x.customData) {
        const c = x.customData;

        if (c._preciseSpeed !== undefined) {
            c.speed = c._preciseSpeed;
            delete c._preciseSpeed;
        }

        if (c._lockPosition !== undefined) {
            c.lockRotation = c._lockPosition;
            delete c._lockPosition;
        }
    }
})

// Lightning
new LightRemapper().type(3).addProcess(x => {
    x.lightID = x.lightID === undefined ? allLightningIDs : lightningIDs[x.lightID as number];
}).setType(1).run();

// Eyes
const eyeIDs = fillArr(eyeID, scene.objectInfo.eyes.max);
new LightRemapper().type(7).setIDs(eyeIDs).setType(1).run();

// Horizon
new LightRemapper().type(6).setIDs(horizonID).setType(1).run();

// Rain
new LightRemapper().type(0).setType(1).setIDs(rainID).multiplyColor(1, 10).run();

// Sun
new LightRemapper().type(4).multiplyColor(0.3, 40).setIDs([1, 2, 3, 4, 5]).run();

//! EXPORT

function forNotes(x: Note | Chain) {
    x.json.customData.spawnEffect = false;
}

map.notes.forEach(x => forNotes(x));
map.chains.forEach(x => forNotes(x));

map.rawSettings = PRESET.CHROMA_SETTINGS;
map.settings.smoke = true;
map.settings.mirrorQuality = "HIGH";
map.settings.noHud = true;

info.environment = "BillieEnvironment";
map.require("Chroma");
map.require("Noodle Extensions", false);
map.save();
exportZip(["ExpertPlusNoArrows"]);
