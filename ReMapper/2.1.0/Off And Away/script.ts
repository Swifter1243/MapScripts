// deno-lint-ignore no-unused-vars
import { ColorType, copy, CustomEvent, CustomEventInternals, Difficulty, EASE, ENV, Environment, EVENT, Event, exportZip, KeyframesLinear, LightRemapper, LOOKUP, ModelScene, PRESET, Regex, transferVisuals, Vec3 } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless.dat", "ExpertPlusStandard.dat");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

//! Fog
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog");
animTrack.animate.height = [200];
animTrack.animate.startY = [-500];
animTrack.push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}

fogAttentuation(0, [1 / 5000]);
fogAttentuation(262, [1 / 40000]);
fogAttentuation(388, [[1 / 40000, 0], [1 / 5000, 1, "easeInOutExpo"]], 4);
fogAttentuation(456, [1 / 40000]);
fogAttentuation(580, [[1 / 40000, 0], [1 / 5000, 1, "easeInOutExpo"]], 4);

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
    "PillarTrackLaneRings",
    "LowCloudsGenerator",
    "TrackMirror",
    "GlowLineL",
    "GlowLineR",
    "GlowLineC",
    "Construction",
    "RectangleFakeGlow",
    "StarEmitterPS",
    "DustPS"
])

env = new Environment("LaserL$", "Regex");
env.active = false;
env.push();

env = new Environment("PillarPair");
env.position = [0, -69420, 0];
env.push();

env = new Environment("DirectionalLight");
env.rotation = [0, -135, 0];
env.push();

// Model
const solidLights: string[] = []
const bloomLights: string[] = []
const clouds: string[] = []

function trackPush(env: Environment, track: string, pushArr: string[]) {
    pushArr.push(track);
    env.track = track;
    env.push();
}

env = new Environment(ENV.BTS.HIGH_CLOUDS.ID, "Regex");
trackPush(env, "cloud1", clouds);
env.duplicate = 1;
for (let i = 2; i <= 6; i++) {
    const track = `cloud${i}`;
    trackPush(env, track, clouds);
}

const BLOOM_LIGHT = {
    ID: new Regex().add("Environment").separate().add("LaserR").end(),
    SCALE: <Vec3>[1, 0.00025, 1],
    ANCHOR: <Vec3>[0, -0.25, 0]
}

// Sun
env = new Environment("GlowLineH$", "Regex");
env.lightID = 100;
env.duplicate = 1;
env.track = "sun"
env.push();

// Solid
env = new Environment(new Regex().add("SmallPillarPair").separate().add("PillarR").separate().add("LaserR").end(), "Regex");
env.lightID = 200;
env.duplicate = 1;
for (let i = 1; i <= 9; i++) trackPush(env, `laser${i}`, solidLights);

// Bloom
env = new Environment(BLOOM_LIGHT.ID, "Regex");
env.lightID = 100;
env.duplicate = 1;
trackPush(env, "horizon", bloomLights);

//! Lights
/*
? HORIZON: CENTER LIGHT ID 1
? SUN: CENTER LIGHT ID 2
? LASERS: LEFT LASERS ID 1-9
*/

new Event().backLasers().on([0, 0, 0, 0]).push(); // Turns back lasers off
new Event().backLasers().on([1, 1, 1].map(x => x * 0.5) as Vec3, 100).push();
// new Event().leftLasers().on([1, 1, 1, 0.3]).push();
// new Event().rightLasers().on([2, 3, 3], [100]).push();

// Horizon
let lrm = new LightRemapper().type(EVENT.CENTER_LASERS).IDs([2]).multiplyColor(3).setType(EVENT.RIGHT_LASERS)
lrm.addProcess(x => { x.lightID = 100 });
lrm.run();
// Sun
lrm = new LightRemapper().type(EVENT.CENTER_LASERS).IDs([1]).multiplyColor(0.4).setType(EVENT.LEFT_LASERS)
lrm.addProcess(x => {
    if (x.lightID) delete x.json._customData._lightID
    const lightCopy = copy(x);
    lightCopy.type = EVENT.CENTER_LASERS;
    lightCopy.lightID = 100;
    if (lightCopy.color) lightCopy.color = lightCopy.color.map((x, i) => i === 3 ? x : x * 50) as ColorType;
    lightCopy.push();
});
lrm.run();
// Lasers
new LightRemapper().type(EVENT.LEFT_LASERS).range([1, 25]).multiplyColor(1, 5).setType(1).normalizeLinear(3, 1).addToEnd(199).run();

//! Model

const scene = new ModelScene(new Environment(ENV.BTS.PILLAR.ID, "Regex"), ENV.BTS.PILLAR.SCALE, ENV.BTS.PILLAR.ANCHOR);
scene.assignObjects(clouds, ENV.BTS.HIGH_CLOUDS.SCALE, ENV.BTS.HIGH_CLOUDS.ANCHOR);
scene.assignObjects("sun", [0.0001, 0.0001, 0.0001]);
scene.assignObjects(solidLights, ENV.BTS.SOLID_LASER.SCALE, ENV.BTS.SOLID_LASER.ANCHOR);
scene.assignObjects(bloomLights, BLOOM_LIGHT.SCALE, BLOOM_LIGHT.ANCHOR);
scene.static("env");

// Export
function exportMap(diff: Difficulty) {
    diff.require("Chroma");
    diff.require("Noodle Extensions", false)
    diff.rawSettings = PRESET.CHROMA_SETTINGS;
    diff.settings.maxShockwaveParticles = 0;
    diff.settings.mirrorQuality = "OFF";
    diff.settings.noHud = true;
    diff.notes.forEach(x => {
        x.spawnEffect = false;
    })
}
exportMap(map);
map.save();
transferVisuals(["ExpertStandard.dat", "HardStandard.dat", "NormalStandard.dat", "EasyStandard.dat"], x => { exportMap(x) });
exportZip(["ExpertPlusLawless.dat"])