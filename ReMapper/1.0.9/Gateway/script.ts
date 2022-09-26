//? Made in ReMapper 1.0.9

import { activeDiff, animateEnvTrack, Animation, BlenderEnvironment, CustomEvent, Difficulty, EASE, ENV, Environment, Event, exportZip, LightRemapper, LOOKUP, PRESET, Regex, SETTINGS, transferVisuals } from "swifter_remapper";
let map = new Difficulty("ExpertPlusStandard.dat");

/* LIGHTS
BACK LIGHTS: Main Glow (turning off needs to be color [0,0,0,0] because BTS moment)
INNER RING 1-8: Above Gateway Lights
INNER RING 9-12: Gateway Side Pillar Lights
LEFT LASERS: Left Giant Lasers
RIGHT LASERS: Right Giant Lasers 
*/

//! Environment stuff
// Remove with contains
let env = new Environment("PillarTrackLaneRing", LOOKUP.CONTAINS);
env.active = false;
env.push();
env.id = "SideLaser";
env.push();
env.id = "StarEmitterPS";
env.push();
env.id = "DustPS";
env.push();

new Event().backLasers().on([0, 0, 0, 0]).push();

// Remove with regex
env.lookupMethod = LOOKUP.REGEX;
env.id = "Construction$";
env.push();
env.id = "TrackMirror$";
env.push();
env.id = "HighCloudsGenerator$";
env.push();
env.id = "RectangleFakeGlow$";
env.push();

// Move outta sight with contains
env = new Environment("GlowLine", LOOKUP.CONTAINS);
env.position = [0, -69420, 0];
env.push();
env.id = "BottomGlow";
env.push();

// Assigning cloud to track
env = new Environment("LowCloudsGenerator$", LOOKUP.REGEX);
env.trackSet = "cloud";
env.push();

//! Left and right lasers
// This is kinda goofy but it's basically repositioning the left and right lasers
let laserNum = 0;
for (let i = 0; i <= 8; i++) {
    for (let s = -1; s <= 1; s += 2) {
        let pair = new Regex().add(i % 2 === 0 ? "PillarPair" : "SmallPillarPair").vary(Math.floor(i / 2)).string;
        let side = s === -1 ? "L" : "R";
        let id = new Regex().start().add(pair).seperate().add(`Pillar${side}`).string;

        // Moving the pillar parent into position
        let env = new Environment(`${id}$`, LOOKUP.REGEX);
        env.position = [s * 450 + (s * 80 * i), i * -40 - 300, i * 300 + 450];
        env.rotation = [30, 0, s * 90];
        env.push();

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

        // Scaling up the left and right lasers
        env = new Environment(undefined, LOOKUP.REGEX);
        env.id = new Regex().add(id).seperate().add(`RotationBase${side}`).seperate().add(`Laser${side}H$`).string;
        env.scale = [20, 5, 20];
        env.push();

        // Assigning the inner ring (1-8) track
        if (i % 2 === 1) {
            env = new Environment(undefined, LOOKUP.REGEX);
            env.id = new Regex().add(id).seperate().add(`Laser${side}`).end().string;
            laserNum++;
            env.trackSet = `laser${laserNum}`;
            env.push();
        }
    }
}

//! Blender stuff
let blenderEnv = new BlenderEnvironment(ENV.BTS.PILLAR.SCALE, ENV.BTS.PILLAR.ANCHOR, ENV.BTS.PILLAR.ID, LOOKUP.REGEX);

// Assigning custom laser positions from blender
let lasers = [];
for (let i = 1; i <= 12; i++) lasers.push(`laser${i}`);
blenderEnv.assignObjects(lasers, ENV.BTS.SOLID_LASER.SCALE, ENV.BTS.SOLID_LASER.ANCHOR);
blenderEnv.assignObjects("cloud", ENV.BTS.LOW_CLOUDS.SCALE, ENV.BTS.LOW_CLOUDS.ANCHOR);

// Earlier had to disable the pillar so I could move the lights around
blenderEnv.static("env", x => { x.active = true })

//! Fog stuff
new CustomEvent().assignFogTrack("fog").push();
let event = new CustomEvent().animateTrack("fog");
event.animate.startY = [-820];
event.animate.attenuation = [0.000001];
event.animate.height = [300];
event.push();

//! Light stuff
// Moves the spotlight reflection things on the blocks
env = new Environment("DirectionalLight", LOOKUP.CONTAINS);
env.rotation = [0, 180, 0];
env.push();

// Center light scale
env = new Environment("MagicDoorSprite$", LOOKUP.REGEX);
env.scale = [1, 1 / 10000, 1]
env.push();

// Center light position
env = new Environment(new Regex().add("MagicDoorSprite").seperate().add("Bloom").string, LOOKUP.REGEX);
env.position = [0, 2, 80];
env.trackSet = "centerBloom";
env.push();

// Center light animation
let anim = new Animation().environmentAnimation();
anim.position = [[0, -5, 0, 0], [0, 0, 0, 1, EASE.IN_OUT_SINE]];
animateEnvTrack("centerBloom", 74, 50, anim);

/*
This is kinda scuffed and idk why I did it this way but
Inner rings 1-8 already exist, so I just add a track and animate those
But inner rings 9-12 don't, so here I'm taking the animation and just
translating it to an environment statement.

If I did this now, I would have just duplicated all of them?? hello??\
who cares
*/
for (let i = 0; i < map.customEvents.length; i++) {
    let x = map.customEvents[i];
    if (
        x.data._track === "laser9" ||
        x.data._track === "laser10" ||
        x.data._track === "laser11" ||
        x.data._track === "laser12"
    ) {
        env = new Environment(ENV.BTS.SOLID_LASER.ID, LOOKUP.REGEX);
        env.duplicate = 1;
        env.lightID = 201 + i;
        env.position = x.data._position;
        env.rotation = x.data._rotation;
        env.scale = x.data._scale;
        env.push();
        map.customEvents.splice(i, 1);
        i--;
    }
}

// Boosting colors of ring lights (1-8)
new LightRemapper(1, [1, 16]).multiplyColor(2).run();
// Moves ring lights (9-12) to duplicated lights
new LightRemapper(1, [17, 20]).normalizeWithChanges([[1, 2], [9, 1]]).addToEnd(200).multiplyColor(2).run();

//! Export
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
