// Made with ReMapper v1.0.11

import { activeDiff, ANIM, animateEnvGroup, animateEnvTrack, Animation, AnimationInternals, arrAdd, arrLast, BlenderEnvironment, clamp, COLOR, Color, combineAnimations, complexifyArray, copy, CustomEvent, CustomEventInternals, Difficulty, EASE, ENV, Environment, ENV_NAMES, EVENT, Event, exportZip, info, Interpolation, isEmptyObject, isSimple, Keyframe, KeyframeArray, KeyframesLinear, KeyframesVec3, KeyframeValues, lerpEasing, LightRemapper, LOOKUP, MODS, Note, notesBetween, PRESET, rand, Regex, rotatePoint, SETTINGS, simplifyArray, SPLINE, transferVisuals, Vec3, Wall } from "swifter_remapper";
import { exec } from "child_process";

let map = new Difficulty("ExpertPlusLawless.dat");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

// This exists to disable a bunch of intense stuff when I'm just testing things, I ain't about to wait 30 seconds every time
const isRelease = true;

//#region //! Timing based stuff

// Fog attentuation
fogAttentuation(0, [1 / 300000]);
fogAttentuation(102, [1 / 100000]);
fogAttentuation(166, [1 / 300000]);
fogAttentuation(230, [1 / 80000]);
fogAttentuation(294 - 2, [[1 / 80000, 0], [1 / 1000, 1, EASE.IN_EXPO]], 2);
fogAttentuation(294, [1 / 50000]);
fogAttentuation(422, [1 / 300000]);
fogAttentuation(518, [1 / 10000]);
fogAttentuation(550, [1 / 100000]);
fogAttentuation(582, [1 / 300000]);
fogAttentuation(606, [1 / 100]);
fogAttentuation(614, [1 / 200000]);
fogAttentuation(622, [1 / 100000]);
fogAttentuation(638, [1 / 500000]);
fogAttentuation(646, [1 / 100000]);
fogAttentuation(662, [1 / 200000]);
fogAttentuation(670, [1 / 300000]);
fogAttentuation(678, [1 / 300000]);

// Fog height
const fogHeight: [number, KeyframesLinear, number?][] = [
    [6, [200]],
    [294, [100]],
    [326, [1000]],
    [358, [100]],
    [390, [300]],
    [470, [200]],
    [478, [100]],
    [486, [50]],
    [518, [0]],
    [550, [[2000, 0], [200, 1, EASE.OUT_EXPO]], 8],
    [622, [[800, 0], [200, 1, EASE.OUT_EXPO]], 8],
    [630, [[2000, 0], [200, 1, EASE.OUT_EXPO]], 8],
    [654, [[2000, 0], [1000, 1, EASE.OUT_EXPO]], 8],
    [670, [[2000, 0], [200, 1, EASE.OUT_EXPO]], 8],
    [709, [600]]
]

// Fog offset
// This exists because I messed up the fog code that's supposed to make it a consistent startY with the model when I was modelling
// I apparently didn't notice it was broken and modeled everything after it.. cba to move animations cause that is a HUGE pain
const fogOffset: [number, number][] = [
    [6, 0],
    [102, 90],
    [166, 250],
    [230, -20],
    [294, 200],
    [326, 1400],
    [358, 150],
    [478, 300],
    [486, 70],
    [518, -69420],
    [550, 600],
    [582, 150],
    [614, 170],
    [622, -90],
    [630, 200],
    [638, 800],
    [646, 500],
    [654, 0],
    [662, -100],
    [678, -20],
    [709, 400]
]

// Environment switches
let envSwitches: [string, number, number?,
    ((moveEvent: CustomEventInternals.AnimateTrack, objects: number) => void)?,
    ((moveEvent: CustomEventInternals.AnimateTrack) => void)?
][] = [
        ["intro", 6, 102],
        ["intro2", 102, 166],
        ["intro3", 166, 230],
        ["build", 230, 294],
        ["drop1_1", 294, 326],
        ["drop1_2", 326, 358],
        ["drop1_3", 358, 390],
        ["drop1_4", 390, 422],
        ["calm", 422, 454],
        ["calm_2", 454, 470],
        ["calm_3", 470, 478],
        ["calm_4", 478, 486],
        ["calm_5", 486, 518],
        ["build2", 518, 550],
        ["drop2_1", 550, 582],
        ["drop2_2", 582, 614],
        ["drop2_3", 614, 622],
        ["drop2_4", 622, 630],
        ["drop2_5", 630, 638],
        ["drop2_6", 638, 646],
        ["drop2_7", 646, 654],
        ["drop2_8", 654, 662],
        ["drop2_9", 662, 670],
        ["drop2_10", 670, 678],
        ["outro", 678, 709],
        ["end", 709, 718]
    ]

// Appends
// This system essentially adds the player's path to the "append" at a given beat for this object
// Useful for things like changing the horizon light's position
let appends: [string, number, Record<string, any>][] = [
    // Main light
    ["mainLight", 102, {
        _position: [0, -20, 0]
    }],
    ["mainLight", 166, {
        _position: [0, 0, 0]
    }],
    ["mainLight", 294, {
        _position: [0, -130, 0]
    }],
    ["mainLight", 422, {
        _position: [0, 0, 0]
    }],
    ["mainLight", 518, {
        _position: [0, 20, 0]
    }],
    ["mainLight", 582, {
        _position: [0, -90, 0]
    }],
    ["mainLight", 614, {
        _position: [0, 20, 0]
    }],
    ["mainLight", 630, {
        _position: [0, -10, 0]
    }],
    ["mainLight", 654, {
        _position: [0, -50, 0]
    }],
    ["mainLight", 662, {
        _position: [0, 20, 0]
    }],
    ["mainLight", 670, {
        _position: [0, -80, 0]
    }],
    ["mainLight", 678, {
        _position: [0, 0, 0]
    }],
    ["mainLight", 709, {
        _position: [0, 10, 0]
    }],
    // Sub light
    ["subLight", 358, {
        _position: [8, -8, 0]
    }],
    ["subLight", 390, {
        _position: [40, 20, 0]
    }],
    ["subLight", 582, {
        _position: [83, -170, 0]
    }]
]

// Rotations for directional light 1
const dirLight1: [number, KeyframesVec3, number?][] = [
    [6, [-40, 180, 0]],
    [166, [-210, -90, 0]],
    [230, [-40, 180, 0]],
    [294, [0, 180, 0]],
    [326, [-40, 180, 0]],
    [358, [-90, 0, 0]],
    [390, [0, 40, 0]],
    [454, [80, 180, 0]],
    [478, [90, 180, 0]],
    [550, [0, 90, 0]],
    [582, [-20, 180 + 20, 0]],
    [614, [20, 180 + 20, 0]],
    [630, [-20, 180 + 20, 0]],
    [638, [0, -90, 0]],
    [646, [0, 180, 0]],
    [654, [-20, -90 - 40, 0]],
    [662, [-40, 180 - 40, 0]],
    [670, [-20, 180 + 20, 0]],
    [678, [0, 180, 0]]
]

// Rotations for directional light 2
const dirLight2: [number, KeyframesVec3, number?][] = [
    [6, [0, 180, 0]],
    [166, [-210, 90, 0]],
    [230, [-70, 180 - 90, 0]],
    [358, [-45, -180, 0]],
    [550, [0, -90, 0]],
    [582, [-10, 180 - 50, 0]],
    [614, [20, 180 - 20, 0]],
    [630, [-20, 180 - 20, 0]],
    [638, [-20, -140, 0]],
    [646, [0, 180, 0]],
    [654, [-20, 90 + 40, 0]],
    [662, [-30, 180, 0]],
    [678, [0, 180 - 20, 0]]
]

// Hud flickers during first half of underground sections, this controls when
const hudFlicker: [number, number][] = [
    // Section 1
    [295, 0.5],
    [297.5, 0.5],
    [301, 1],
    [303, 0.5],
    [305.5, 0.5],
    [309, 1],
    [311, 0.5],
    [313.5, 0.5],
    [317, 1],
    [319, 0.5],
    [321.5, 0.5],
    [325, 1],
    // Section 2
    [327, 0.5],
    [329.5, 0.5],
    [333, 1],
    [335, 0.5],
    [337.5, 0.5],
    [343, 0.5],
    [345.5, 0.5],
    [349, 1],
    [351, 0.5],
    [353.5, 0.5],
    [357, 1],
]
//#endregion

//#region //! Beam texture
// Particles on the big citadel beams
// This is probably overcomplicated but I started off with a pretty advanced system and ended up with an "it works don't touch it" situation
new CustomEvent().assignTrackParent(["beam"], "beamParent").push();
animTrack = new CustomEvent(606).animateTrack("beamParent");
animTrack.animate.position = "yeet";
animTrack.push();
animTrack.time = 678;
animTrack.push();

const beamStart = 550
const beamEnd = 678
const beamFreq = 1 / 32;
const beamLife = 0.5;

const beamSpread = 1000;
const beamOffset = (7000 * -0.49 * 0.6)
const beamSpeedMin = 200;
const beamSpeedMax = 300;

const beamRadius = 10;
const beamJump = 10;

const beamMinHeight = 20;
const beamMaxHeight = 50;
const beamWidth = 2;

if (isRelease) for (let t = beamStart; t < beamEnd; t += beamFreq) {
    // Skips the particles if tower is out of range
    if (
        (t >= 582 && t < 612) ||
        (t >= 638 && t < 654) ||
        (t >= 662)
    ) continue;

    const yScale = rand(beamMinHeight, beamMaxHeight);
    const yOffset = rand(beamSpread, 0);
    const scaleSpread = (1 - yOffset / beamSpread) * 0.5 + 0.5;
    const speedOffset = rand(beamSpeedMin, beamSpeedMax) / 2;
    const wallRot = rand(0, 360)
    const wallPos: RawKeyframesVec3 = [
        [...rotatePoint([0, wallRot, 0], [beamRadius, wallRot, 0]), 0],
        [...rotatePoint([0, wallRot, 0], [(beamRadius + rand(0, beamJump)) * scaleSpread, wallRot, 0]), 1, EASE.OUT_EXPO]
    ];

    wallPos.forEach(x => {
        x[1] += beamOffset;
        x[1] -= yOffset
    });

    const wall = new Wall();
    wall.life = beamLife;
    wall.lifeStart = t;
    wall.animate.definitePosition = wallPos;
    wall.animate.dissolve = [[0, 0], [1, 0]]
    wall.animate.position = [[0, speedOffset, 0, 0], [0, -speedOffset, 0, 1]]
    wall.animate.scale = [
        [1, 1, 1, 0],
        [1 / 10000, 1, 1 / 10000, 1, EASE.IN_EXPO]
    ]
    wall.color = [60, 60, 60, 1];
    wall.scale = [beamWidth * scaleSpread, yScale, beamWidth * scaleSpread];
    wall.interactable = false;
    wall.fake = true;
    wall.trackSet = "beam";
    wall.push();
}

//#endregion

//#region //! Water
// This determines how much I am going to scale up the noise of the wall (scale down, animate scale up)
const wallDetail = 2000;

let waterWall = new Wall();
waterWall.life = 550 - 518;
waterWall.lifeStart = 518;
waterWall.trackSet = "wall";
waterWall.color = [...[0.482, 0.698, 0.686].map(x => x * 1) as Vec3, 20];
waterWall.animate.definitePosition = [[0, 0, 0, 0], [0, 0, 15, 1]];
waterWall.scale = [wallDetail, wallDetail, wallDetail];
waterWall.interactable = false;
waterWall.fake = true;
waterWall.push();
//#endregion

//#region //! Player
// For some stupid reason the fog seems to always dissolve stuff under y = 0 so I have to TP the player up
const startPos: Vec3 = [0, 1000, 0];

new CustomEvent().assignPlayerToTrack("player").push();
new CustomEvent().assignTrackParent(["note"], "player").push();
animTrack = new CustomEvent().animateTrack("player");
animTrack.animate.position = startPos;
animTrack.push();
//#endregion

//#region //! Fog
new CustomEvent().assignFogTrack("fog").push();

function fogAttentuation(time: number, animation: KeyframesLinear, duration: number = 0) {
    animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}
//#endregion

//#region //! Environment Stuff

// Remove with contains
env = new Environment("PillarTrackLaneRing", LOOKUP.CONTAINS);
env.active = false;
env.push();
env.id = "SideLaser";
env.push();
env.id = "MagicDoorSprite";
env.push();
env.id = "StarEmitterPS";
env.push();
env.id = "DustPS";
env.push();

// Remove with regex
env.lookupMethod = LOOKUP.REGEX;
env.id = "Construction$";
env.push();
env.id = "TrackMirror$";
env.push();
env.id = new Regex().add("PlayersPlace").seperate().add("Mirror$").string;
env.push();
env.id = new Regex().add("PlayersPlace").seperate().add("RectangleFakeGlow$").string;
env.push();
env.id = new Regex().add("PlayersPlace").seperate().add("SaberBurnMarksParticles$").string;
env.push();
env.id = new Regex().add("PlayersPlace").seperate().add("SaberBurnMarksArea$").string;
env.push();
env.id = new Regex().add("PlayersPlace").seperate().add("Collider$").string;
env.push();
env.id = new Regex().add("NarrowGameHUD").seperate().add("RightPanel$").string;
env.push();
env.id = new Regex().add("NarrowGameHUD").seperate().add("LeftPanel").seperate().add("ScoreCanvas").seperate().add("ScoreText$").string;
env.push();
env.id = new Regex().add("NarrowGameHUD").seperate().add("LeftPanel").seperate().add("ComboPanel").seperate().add("Line(0|1)$").string;
env.push();

// Move outta sight
env = new Environment("GlowLine", LOOKUP.CONTAINS);
env.position = [0, -69420, 0];
env.push();
env.id = "BottomGlow";
env.push();
env.id = "PillarPair";
env.push();

// Assign clouds
env.lookupMethod = LOOKUP.REGEX;
env.id = "LowCloudsGenerator$";
env.trackSet = "lowCloud";
env.push();
env.id = "HighCloudsGenerator$";
env.trackSet = "highCloud";
env.push();
env.duplicate = 1;
env.trackSet = "highCloud2";
env.push();
env.duplicate = 1;
env.trackSet = "highCloud3";
env.push();
env.duplicate = 1;
env.trackSet = "highCloud4";
env.push();

// Assign HUD
delete env.json._duplicate; // lazyness
env.id = new Regex().add("NarrowGameHUD").seperate().add("EnergyPanel$").string;
env.trackSet = "hudEnergy";
env.push();
env.id = new Regex().add("NarrowGameHUD").seperate().add("LeftPanel").seperate().add("ComboPanel$").string;
env.trackSet = "hudCombo";
env.push();
env.id = new Regex().add("NarrowGameHUD").seperate().add("LeftPanel").seperate().add("ScoreCanvas$").string;
env.trackSet = "hudScore";
env.push();

// Animate HUD
new CustomEvent().assignTrackParent(["hudScore", "hudCombo", "hudEnergy"], "hud").push();

const hudStart = 294;
const hudEnd = 358;
const hudDur = hudEnd - hudStart;
const hudRate = 1 / 8;
const hudAnim: RawKeyframesVec3 = [[0, 0, 0, hudStart]];

hudFlicker.forEach(x => {
    const time = x[0];
    const dur = x[1];

    for (let t = time; t < time + dur; t += hudRate) {
        hudAnim.push([1, 1, 1, t, EASE.STEP]);
        hudAnim.push([0, 0, 0, t + hudRate / 2, EASE.STEP]);
    }
})

hudAnim.push([1, 1, 1, 326 - 0.05, EASE.STEP]);
hudAnim.push([0, 0, 0, 326 + 0.05, EASE.STEP]);
hudAnim.push([1, 1, 1, hudEnd - 0.05, EASE.STEP]);

hudAnim.forEach(x => {
    x[3] = (x[3] - hudStart) / hudDur;
})

animTrack = new CustomEvent(hudStart).animateTrack("hud", hudDur);
animTrack.animate.scale = hudAnim;
animTrack.push();

// Assign Directional Lasers
env = new Environment(undefined, LOOKUP.REGEX);
env.active = true;
env.id = new Regex().seperate(5).add("DirectionalLight$").string;
env.trackSet = "dirLight1";
env.push();
env.id = new Regex().seperate(3).add("DirectionalLight$").string;
env.trackSet = "dirLight2";
env.push();
//#endregion

//#region //! Lights
//? - LEFT LASERS 1-9: SOLID LASERS
//? - RIGHT LASERS 1-9: BLOOM LASERS
//? - CENTER LIGHTS 1: MAIN LIGHT
//? - CENTER LIGHTS 2: SUB LIGHT
//? - CENTER LIGHT ALL: DIRECTIONAL LIGHT 1
//? - BACK LASERS ALL: DIRECTIONAL LIGHT 2

let solidLasers: string[] = [];
let bloomLasers: string[] = [];
const solidID = ENV.BTS.SOLID_LASER.ID;
const bloomID = new Regex().add("Environment").seperate().add("LaserL$").string;

// Type 1, 101-109 (Solid Lasers)
for (let i = 1; i <= 9; i++) {
    env = new Environment("", LOOKUP.REGEX);
    env.id = solidID;
    env.duplicate = 1;
    env.trackSet = `solidLaser${i}`;
    env.position = [i, 0, 20];
    env.lightID = 101;
    env.push();
    solidLasers.push(env.track.value as string);
}

// Type 4, 101-109 (Bloom Lasers)
for (let i = 1; i <= 9; i++) {
    env = new Environment("", LOOKUP.REGEX);
    env.id = bloomID;
    env.duplicate = 1;
    env.trackSet = `bloomLaser${i}`;
    env.rotation = [0, 0, 180];
    env.position = [i, 0, 20];
    env.lightID = 101;
    env.push();
    bloomLasers.push(env.track.value as string);
}

// Type 4, 201-202 (Main Light)
let glowY = 2;
let glowZ = 200;
let glowRot = 30;
let glowDist = 15;

env = new Environment("", LOOKUP.REGEX);
env.id = bloomID;
env.duplicate = 1;
env.lightID = 201;
env.json.follow = true;
env.group = "mainLight";
env.trackSet = "mainLight"
env.position = [-glowDist, glowY, glowZ];
env.rotation = [0, glowRot, -90];
env.scale = [1, 100 / 5, 1];
env.push();
env.trackSet = "mainLight2"
env.position = [glowDist, glowY, glowZ];
env.rotation = [0, -glowRot, 90];
env.scale = [1, 100 / 5, 1];
env.push();

// Type 4, 203 (Sub Light)
env.id = solidID
env.group = "subLight";
env.trackSet = "subLight"
env.position = [0, glowY, glowZ];
env.rotation = [0, 0, 0];
env.scale = [1 / 10000, 1 / 10000, 1 / 10000];
env.json.follow = true;
env.push();

// Solid Lasers
new LightRemapper(EVENT.LEFT_LASERS).normalizeLinear(1, 3).addToEnd(100).multiplyColor(1, 4).setType(1).run();
// Bloom Lasers
new LightRemapper(EVENT.RIGHT_LASERS).normalizeLinear(1, 3).addToEnd(100).multiplyColor(3 / 2, 1).setType(2).run();
// Main Light
new LightRemapper(EVENT.CENTER_LASERS, 2).setType(2).setLightID([201, 202]).multiplyColor(3 * 0.4, 1).run();
// Sub Light
new LightRemapper(EVENT.CENTER_LASERS, 1).setType(1).setLightID(201).multiplyColor(6, 1).run();

// Animate directional lights
dirLight1.forEach(x => {
    const event = new CustomEvent(x[0]).animateTrack("dirLight1", x[2]);
    event.animate.rotation = x[1];
    event.push();
})

dirLight2.forEach(x => {
    const event = new CustomEvent(x[0]).animateTrack("dirLight2", x[2]);
    event.animate.rotation = x[1];
    event.push();
})
//#endregion

//#region //! Following Objects
// Gets the append at a given time, append system explained earlier
function getAppend(group: string, time: number) {
    appends = appends.sort((a, b) => a[1] - b[1]);

    let value: any = {};
    appends.forEach(x => {
        if (x[0] == group && x[1] <= time) {
            let obj = x[2];
            for (const key in obj) value[key] = obj[key];
        }
    });
    return value;
}
//#endregion

//#region //! Blender
// Assigning all my stuff here
let blenderEnv = new BlenderEnvironment(ENV.BTS.PILLAR.SCALE, ENV.BTS.PILLAR.ANCHOR, ENV.BTS.PILLAR.ID, LOOKUP.REGEX);
blenderEnv.assignObjects("player", undefined, undefined, false);
blenderEnv.assignObjects("wall", [1, 1, 1].map(x => x / 0.6 * wallDetail) as Vec3, [0, 0.5, 0.5]);
blenderEnv.assignObjects("lowCloud", ENV.BTS.LOW_CLOUDS.SCALE, ENV.BTS.LOW_CLOUDS.ANCHOR);
blenderEnv.assignObjects(["highCloud", "highCloud2", "highCloud3", "highCloud4"], [800, 40, 800], ENV.BTS.LOW_CLOUDS.ANCHOR);
blenderEnv.assignObjects(bloomLasers, [1 / 3.5, 1400 * 5, 1 / 3.5], [0, 0.5, 0]);
blenderEnv.assignObjects(solidLasers, [1 / 3, 7000, 1 / 3], [0, 0.49, 0]);
blenderEnv.assignObjects("hudEnergy", [335, 22, 1], [0, 0, 0]);
blenderEnv.assignObjects("hudCombo", [130, 140, 1], [0, 0, 0]);
blenderEnv.assignObjects("hudScore", [70, 90, 1], [0, -0.45, 0]);

// Disabling optimizers if I'm only testing
if (!isRelease) {
    blenderEnv.optimizeSettings = undefined;
    blenderEnv.assignedOptimizeSettings = undefined;
}

// Here I try to account for the player rotating around their feet causing lots trail movement
function accountSaberPos(pos: Vec3, rot: Vec3) {
    let saberPos: Vec3 = [0, 1.5, 1];
    saberPos = rotatePoint(rot, saberPos);
    return arrAdd(pos, saberPos) as Vec3;
}

/*
OK let me try to break down what's happening with the continue position and performance spread stuff

Problem #1: Teleporting the player across a long distance causes trails to make a huge line from point A to point B.

My solution for this is to move the fog and environment spawn in positions so 
the player's end point in environment A lines up with the starting point in environment B.

This difference is referred to as the "continue position".

Notice how the player is assigned to the environment first, it is able to calculate the continue position for that switch,
then go back through the primary environment switch events that just happened, add the continue position,
and then since it is assigned first, it can add the continue position to all assigned objects after that.

The way I tell which objects are from the most recent switch is checking for the existence of custom data for `animOffset`, 
which I apply in the events from the primary switch, which also nicely ties into the second problem.

Problem #2: Spawning ~1000 AnimateTrack events on the same beat causes the game to have a lag spike (who woulda guessed)

My solution in this case is to spread out the events backward with a random offset, and shifting the animation forward to 
compensate, all while getting the animation from the previous switch, tacking it onto the part where the events overlap so
that the animation from the previous switch can continue seamlessly even though the next event has already started.

The continue position complicates things, as we store the raw animation from the previous switch to sample in the next one,
which doesn't have the continue position applied, while the current position is going to get a new continue position from
the current switch.

The solution for this is actually pretty elegant, since the events for the switches are processed before assigned stuff,
the continue position hasn't been updated yet, so we can just add that to the information that was stored in the previous
switch, since the continue position is actually old.

We need to make sure that the new continue position isn't added to the overlap part of the animation where the old continue
position was just added, so we store a threshold in the event for when the overlap ends and where the new continue position
can be added, which also doubles as the way I mentioned earlier to check if an event has had the continue position added yet.

Yeah.. this is pretty complicated so I don't expect anyone to understand wtf is going on. It's fucking crazy but it works.
*/

// Continue position initialization
let continuePos = copy(startPos);
let lastEndPos = copy(startPos);

// Previous animation memory
let envAnims: Record<string, {
    transform: AnimationTransforms,
    updateTime: number
}> = {}

let switchTime = 0;
let switchTime2 = 0;
const performanceSpread = 5; // How much the events will be spread out

// Type for storing the environment animations (I am a nerd)
type AnimationTransforms = {
    position: KeyframesVec3;
    rotation: KeyframesVec3;
    scale: KeyframesVec3;
}

// This is so I can iterate through keyframes without TS screaming at me that it could be a 1D array
type RawKeyframesVec3 = [number, number, number, number, Interpolation?, SPLINE?][];

// Switches happen here
envSwitches.forEach(x => {
    if (x[2] !== undefined) x[2] = x[2] - x[1];
    x[3] = y => forEnv(y);
    x[4] = y => forAssigned(y);
});
blenderEnv.animate(envSwitches);

function forEnv(event: CustomEventInternals.AnimateTrack) {
    // Here's how I determine if a switch has happened
    if (event.time > switchTime) {
        switchTime2 = switchTime;
        switchTime = event.time;
    }

    // Initializing these variables
    let lastAnim: AnimationTransforms = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
    };

    let currentAnim: AnimationTransforms = {
        position: copy(event.animate.position),
        rotation: copy(event.animate.rotation),
        scale: copy(event.animate.scale)
    };

    // Storing animation
    const trackValue = event.track.value as string;
    if (envAnims[trackValue] && envAnims[trackValue].updateTime === switchTime2) lastAnim = copy(envAnims[trackValue].transform);
    envAnims[trackValue] = {
        transform: copy(currentAnim),
        updateTime: copy(event.time)
    }

    // The offset this particular event will have backwards
    const timeOffset = rand(0, event.time === 6 ? 0.01 : performanceSpread);

    // Boring math for animation stuff
    const fraction = event.duration / (event.duration + timeOffset);
    const animOffset = 1 - fraction;

    event.time -= timeOffset;
    event.duration += timeOffset;

    // This adds the previous and current animations together
    function transformAnimation(current: KeyframesVec3, prev: KeyframesVec3) {
        let anim: RawKeyframesVec3 = complexifyArray(current) as RawKeyframesVec3;
        anim[0][4] = EASE.STEP;

        anim.forEach(x => {
            x[3] *= fraction;
            x[3] += animOffset;
        })

        const dataAnim = new Animation().abstract();
        dataAnim.position = prev;

        let prevAnim = complexifyArray(dataAnim.get(ANIM.POSITION, fraction)) as RawKeyframesVec3;
        prevAnim = prevAnim.concat((complexifyArray(prev) as RawKeyframesVec3).filter(x => {
            return x[3] > 1 - animOffset;
        }).map(x => {
            x[3] -= 1 - animOffset;
            return x;
        }))

        return prevAnim.concat(anim);
    }

    // Adding continue position to the previous half of the animation
    lastAnim.position = (complexifyArray(lastAnim.position) as RawKeyframesVec3).map(x => {
        x[0] += continuePos[0];
        x[1] += continuePos[1];
        x[2] += continuePos[2];
        return x;
    })

    // Transforming the animations based on function above
    event.animate.position = transformAnimation(currentAnim.position, lastAnim.position);
    event.animate.rotation = transformAnimation(currentAnim.rotation, lastAnim.rotation);
    event.animate.scale = transformAnimation(currentAnim.scale, lastAnim.scale);
    event.json.animOffset = animOffset;
}

function forAssigned(event: CustomEventInternals.AnimateTrack) {
    if (event.track.has("player")) {
        // Using correct properties for player animation
        event.animate.localRotation = event.animate.rotation;
        delete event.json._data._rotation;
        delete event.json._data._scale;

        // Finding continue position
        const currentPos = event.animate.get(ANIM.POSITION, 0);
        const currentRot = event.animate.get(ANIM.LOCAL_ROTATION, 0);
        continuePos = arrAdd((accountSaberPos(currentPos, currentRot)).map(x => -x), lastEndPos) as Vec3;

        // Applying continue position to current environment switch
        map.customEvents.forEach(x => {
            if (x.json.animOffset) {
                if (typeof x.data._position[0] === "number") x.data._position = [[...(x.data._position as Vec3), 0]];
                (x.data._position as RawKeyframesVec3).forEach(y => {
                    if (y[3] >= x.json.animOffset) {
                        y[0] += continuePos[0];
                        y[1] += continuePos[1];
                        y[2] += continuePos[2];
                    }
                });
                delete x.json.animOffset;
            }
        })

        // Applying continue position to fog
        // I'm not gonna sit here and act like I'm comfortable ever touching this again
        let returned = false;
        let animation: KeyframesLinear = [];
        let duration = 0;
        let offset = 0;

        fogHeight.forEach(x => {
            if (!returned) {
                if (event.time >= x[0]) {
                    animation = copy(x[1]);
                    duration = x[2] ?? 0;
                }
                else {
                    returned = true;
                }
            }
        })

        returned = false;

        fogOffset.forEach(x => {
            if (!returned) {
                if (event.time >= x[0]) {
                    offset = x[1];
                }
                else {
                    returned = true;
                }
            }
        })

        animTrack = new CustomEvent(event.time).animateTrack("fog");
        animTrack.animate.height = copy(animation);

        animation = (complexifyArray(animation) as number[][]).map(y => {
            y[0] = (continuePos[1] / 0.6 / 3) - (y[0] * 0.6 * 3 / 2) + offset;
            return y;
        }) as KeyframesLinear;

        animTrack.animate.startY = animation;
        if (duration > 0) animTrack.duration = duration;
        animTrack.push();
    }

    // Applying continue position to assigned
    if (typeof event.animate.position[0] === "number") (event.animate.json as any)[ANIM.POSITION] = [[...(event.animate.position as Vec3), 0]];
    (event.animate.position as [...Vec3, number, Interpolation?, SPLINE?][]).forEach(x => {
        x[0] += continuePos[0];
        x[1] += continuePos[1];
        x[2] += continuePos[2];
    });

    if (event.track.has("player")) {
        // Updating last position
        const currentPos = event.animate.get(ANIM.POSITION, 1);
        const currentRot = event.animate.get(ANIM.LOCAL_ROTATION, 1);
        lastEndPos = accountSaberPos(currentPos, currentRot);

        // Animating following objects
        map.environment.forEach(x => {
            if (x.json.follow) {
                let transform = getAppend(x.group, event.time);
                let playerAnim: any = copy(event.animate.json);
                let animation = new Animation().abstract();
                for (const key in playerAnim) {
                    if (key === "_position") {
                        let value = playerAnim[key];
                        if (transform[key]) value = combineAnimations(playerAnim[key], transform[key], ANIM.POSITION) as KeyframesVec3;
                        animation.position = value;
                    }
                }
                animateEnvTrack(x.track.value as string, event.time, event.duration, animation);
            }
        })

        // Rain
        if (isRelease && event.time === 6) {
            const rainAmount = 5;
            const rainSpread = 200;
            const rainZ = [-100, 200];
            const rainStart = 6;
            const rainEnd = 94;

            for (let t = rainStart; t < rainEnd; t += 0.25) {
                let playerPos = event.animate.get(ANIM.POSITION, (t - 6) / (rainEnd - rainStart));
                for (let i = 0; i <= rainAmount; i++) {
                    let rainPos = [rand(-rainSpread, rainSpread), 0, rand(rainZ[0], rainZ[1])];
                    rainPos = arrAdd(playerPos, rainPos);
                    let randHeight = rand(-30, 30);

                    let wall = new Wall();
                    wall.life = 0.5;
                    wall.lifeStart = t;
                    wall.animate.definitePosition = [[rainPos[0], rainPos[1] + 30 + randHeight, rainPos[2], 0], [rainPos[0], rainPos[1] - 110 + randHeight, rainPos[2], 1]];
                    wall.animate.dissolve = [[0, 0], [0.5, 0]]
                    wall.color = [0.5, 0.5, 0.5, 0];
                    wall.scale = [1 / 15, 20, 1 / 15];
                    wall.interactable = false;
                    wall.fake = true;
                    wall.push();
                }
            }
        }
    }

    // Moving beam particles to beam
    if (event.track.has("solidLaser9") && event.time >= 550 && event.time <= 670) {
        const beamEvent = new CustomEvent().import(copy(event.json));
        beamEvent.trackSet = "beamParent";
        const scale = complexifyArray(beamEvent.animate.scale) as RawKeyframesVec3;
        scale.forEach(x => {
            x[0] = Math.abs(x[0]) / 100;
            x[1] = Math.abs(x[1]);
            x[2] = Math.abs(x[2]) / 100;
        })
        beamEvent.animate.scale = scale;
        beamEvent.animate.localRotation = beamEvent.json._data._rotation;
        delete beamEvent.json._data._rotation
        beamEvent.push();
    }

    // Moving wall to assigned wall object
    if (event.track.has("wall")) {
        (event.animate.position as KeyframeArray).forEach(x => { (x[0] as number) -= wallDetail * 0.5 })
        event.animate.localRotation = event.animate.rotation;
        delete event.json._data._rotation;
    }
}
//#endregion

//#region //! Notemods
// Type for my sectioning function
type Transition = {
    function: (x: AnimationInternals.AbstractAnimation) => void,
    time?: number;
    ease?: EASE;
}

// Gives notes a path
function pathNotes(anim: (x: AnimationInternals.AbstractAnimation) => void, time: number = 0, duration: number = 0, easing?: EASE) {
    const event = new CustomEvent(time).assignPathAnimation("note", duration);
    anim(event.animate);
    if (easing) event.easing = easing;
    event.push();
}

// Gives notes an animation
function animateNotes(anim: (x: AnimationInternals.AbstractAnimation) => void, time: number = 0, duration: number = 0, easing?: EASE, track = "note") {
    const event = new CustomEvent(time).animateTrack(track, duration);
    anim(event.animate);
    if (easing) event.easing = easing;
    event.push();
}

/**
 * Rotates a path with a rotation that gradually effects the path less and less as lifetime goes on.
 * @param path Original path
 * @param rotation Rotation
 * @param effectMul Multiplier for rotation
 * @param effectEasing How much the rotation effects things through the lifetime
 * @returns 
 */
function rotatePath(path: KeyframesVec3, rotation: Vec3, effectMul = 1, effectEasing = EASE.LINEAR) {
    const combineDegrees = (deg1: number, deg2: number) => (deg1 + deg2) % 360

    const rotations = complexifyArray(copy(path)) as RawKeyframesVec3;
    rotations.forEach(x => {
        const effectAmount = lerpEasing(effectEasing, (0.5 - x[3]) * 2) * effectMul;
        // const effectAmount = 1;
        x[0] = combineDegrees(x[0], rotation[0] * effectAmount);
        x[1] = combineDegrees(x[1], rotation[1] * effectAmount);
        x[2] = combineDegrees(x[2], rotation[2] * effectAmount);
    })

    return rotations;
}

/**
 * Generates rotated paths to ease into a scene based on player path. This is very rough and often sucks and doesn't work.
 * @param start Start player path rotation
 * @param middle Resting player path rotation
 * @param end End player path rotation
 * @param inPath The path that the transition will ease into
 * @param outPath The path that the transition will ease out of (uses inPath if undefined)
 * @param effectMul Multiplier for rotation
 * @param effectEasing How much the rotation effects things through the lifetime
 * @returns 
 */
function makeTransitions(start: Vec3, middle: Vec3, end: Vec3, inPath: KeyframesVec3, outPath?: KeyframesVec3, effectMul = 1.5, effectEasing = EASE.OUT_CUBIC) {
    outPath ??= inPath;
    const inRot = arrAdd(start, middle.map(x => x * -1)).map(x => x * 1) as Vec3;
    const outRot = arrAdd(middle, end.map(x => x * -1)).map(x => x * -1) as Vec3;
    return {
        in: rotatePath(inPath, inRot, effectMul, effectEasing),
        out: rotatePath(outPath, outRot, effectMul, effectEasing)
    }
}

/**
 * Replaces the last element of an array with a different keyframe.
 * @param arr Animation array
 * @param value Keyframe to replace
 * @returns 
 */
function adjustLast(arr: KeyframesVec3, value: [number, number, number, number, Interpolation?, SPLINE?]) {
    let newArr = complexifyArray(copy(arr)) as RawKeyframesVec3;
    newArr[newArr.length - 1] = value;
    return newArr;
}

/**
 * Interface to easily control the path of notes over a period of time with a path to ease in from, and a path to ease out to.
 * And a way to easily control the time each transition takes, and the time of the paths during the evolution.
 * All while automatically controlling the time and duration necessary to make those events fit.
 * @param start Start of section
 * @param end End of section
 * @param leadIn Path of notes on the switch
 * @param evolution Path evolution of notes over the switch, first path is what the "leadIn" path leads into (required)
 * @param leadOut Path of notes that will be lead into when leaving section
 * @param leadTime Duration for lead in/out
 */
function noteSection(
    start: number,
    end: number,
    leadIn?: Transition,
    evolution?: [number, (x: AnimationInternals.AbstractAnimation) => void, EASE?][],
    leadOut?: Transition
) {
    let leadInTime = leadIn ? leadIn.time ?? 5 : 5;
    let leadOutTime = leadOut ? leadOut.time ?? 5 : 5;
    const leadInEase = leadIn ? leadIn.ease ?? EASE.OUT_EXPO : EASE.OUT_EXPO;
    const leadOutEase = leadOut ? leadOut.ease ?? EASE.IN_EXPO : EASE.IN_EXPO;
    const fullDur = end - start - leadInTime - leadOutTime;

    if (leadIn) pathNotes(x => leadIn.function(x), start)
    else leadInTime = 0;
    if (leadOut) pathNotes(x => leadOut.function(x), end - leadOutTime, leadOutTime, leadOutEase);
    else leadOutTime = 0;
    if (evolution) {
        let lastTime = 0;

        evolution.forEach((path, i) => {
            const easing = path[2];
            const pathDur = path[0] * fullDur - lastTime + leadInTime;
            const time = lastTime + start;
            lastTime = path[0] * fullDur + leadInTime;

            if (i === 0) pathNotes(x => path[1](x), start, leadInTime, leadInEase);
            else pathNotes(x => path[1](x), time, pathDur, easing);
        })
    }
}

// Note offset math
const offset = 30;
const getArriveTime = (interval: number) => 0.5 - (0.25 / offset * interval);
const getCurveDist = (dist: number, arriveTime: number) => dist * (0.5 - arriveTime) * 1.5;
let arriveTime = 0.5;

/*
Notemods have little patterns so I did my best to give myself a workflow with the common things I could find.
You'll see a lot of section functions being called as well as individual tweaks for things.
There's no real way around having to make plenty of adjustments over time, though.
*/

let startRot: KeyframesVec3;
let endRot: KeyframesVec3;
let transitions: {
    in: KeyframesVec3,
    out: KeyframesVec3
}

// Map start
pathNotes(x => {
    x.dissolve = [[0, 0.43], [1, 0.48]];
    x.dissolveArrow = [[0, 0.43], [1, 0.48]];
    x.rotation = [[0, 0, -40, 0.43], [0, 0, 0, 0.5, EASE.OUT_CIRC]];
    x.position = [[0, -2, 0, 0.43], [0, 0, 0, 0.5, EASE.OUT_CIRC]];
}, 0)

// Intro
startRot = [[4, 3, -3, 0], [5, 10, 4, 0.4, EASE.OUT_SINE], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
transitions = makeTransitions([-17.7, 2.04, 36.1], [1.98, 1.48, 6.64], [1.45, 1.41, 8.37], startRot, undefined, 4);
arriveTime = getArriveTime(8);

noteSection(6, 102, {
    function: x => {
        x.rotation = transitions.in;
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.dissolve = [[0, 0], [1, 0.05]];
        x.dissolveArrow = [[0, 0], [1, 0.05]];
    }
}, [
    [0, x => {
        x.rotation = startRot;
    }]
], {
    function: x => {
        x.rotation = adjustLast(transitions.out, [-2.5, 0, 0, 0.5]);
    }, ease: EASE.IN_EXPO, time: 4
})

// Chasm
startRot = [[-20, -10, 0, 0], [10, 2, 0, 0.3, EASE.OUT_SINE], [-2.5, 0, 0, 0.5, EASE.IN_OUT_SINE]];
endRot = [[20, -10, 4, 0], [-10, 2, 4, 0.3, EASE.OUT_SINE], [-2.5, 0, 0, 0.5, EASE.IN_OUT_SINE]];
transitions = makeTransitions([4.98, 0.649, 12], [0.487, 1.07, 0.207], [-9.05, 1.05, -0.811], startRot, endRot, 1);
arriveTime = getArriveTime(4);

noteSection(102, 166, {
    function: x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_EXPO],
            [0, 0, 0, 0.5, EASE.OUT_EXPO]
        ];
        x.rotation = transitions.in;
    }
}, [
    [0, x => {
        x.rotation = startRot;
    }],
    [1, x => {
        x.rotation = endRot;
    }]
], {
    function: x => {
        x.rotation = transitions.out;
    }, time: 2
})

// Mountain
const mountainLift = -10;

startRot = [
    [-10 + mountainLift, 0, 0, 0],
    [-8 + mountainLift, -1, 0, 0.1, EASE.IN_OUT_SINE],
    [-6 + mountainLift, 2, 0, 0.2, EASE.IN_OUT_SINE],
    [-4 + mountainLift, -3, 0, 0.3, EASE.IN_OUT_SINE],
    [-2 + mountainLift, 4, 0, 0.4, EASE.IN_OUT_SINE],
    [-5, 0, 0, 0.5, EASE.IN_OUT_SINE]
];
endRot = [
    [-10 + mountainLift, 0, 0, 0],
    [-8 + mountainLift, 1, 0, 0.1, EASE.IN_OUT_SINE],
    [-6 + mountainLift, -2, 0, 0.2, EASE.IN_OUT_SINE],
    [-4 + mountainLift, 3, 0, 0.3, EASE.IN_OUT_SINE],
    [-2 + mountainLift, -4, 0, 0.4, EASE.IN_OUT_SINE],
    [-10, 0, 0, 0.5, EASE.IN_OUT_SINE]
];
transitions = makeTransitions([9.95, 0.477, 1.47], [0.0613, 0.18, 0.00269], [0, 0, 0], startRot, endRot, 1);
arriveTime = getArriveTime(5);

noteSection(166, 230, {
    function: x => {
        x.rotation = adjustLast(transitions.in, [-2.5, 0, 0, 0.5, EASE.IN_OUT_SINE]);;
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }
}, [
    [0, x => {
        x.rotation = startRot;
    }],
    [1, x => {
        x.rotation = endRot;
    }],
], {
    function: x => {
        x.rotation = adjustLast(endRot, [-5, 0, 0, 0.5, EASE.IN_OUT_SINE]);
    }
})

// Edge of the Overworld
arriveTime = getArriveTime(5);

noteSection(230, 294, {
    function: x => {
        x.rotation = x.rotation = [[20, -30, 0, 0], [-5, 0, 0, 0.5]];
    }
}, [
    [0, x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_CUBIC],
            [0, 0, 0, 0.5, EASE.OUT_CUBIC]
        ];
        x.rotation = [[20, -30, 0, 0], [0, 0, 0, 0.5]];
    }],
    [0.9, x => {
        x.rotation = [[20, -15, 0, 0], [0, 0, 0, 0.5]];
    }]
], {
    function: x => {
        x.rotation = [[0, -15, 0, 0], [0, 0, 0, 0.5]];
    }
})

// Underworld's Ceiling
arriveTime = getArriveTime(2);
let arriveLead = Math.max(arriveTime - 0.05, 0);

noteSection(294, 326, undefined, [
    [0, x => {
        x.rotation = [[-3, 0, 0, arriveLead], [0, 0, 0, arriveTime]];
        x.position = [[0, 0, 200, 0], [0, 0, 0, arriveTime, EASE.IN_EXPO]];
        x.dissolve = [[0, arriveLead], [1, arriveTime]];
        x.dissolveArrow = [[0, arriveTime - 0.1], [1, arriveTime]];
    }]
])

// Underworld
pathNotes(x => {
    x.rotation = [[3, 0, 45, arriveLead], [0, 0, 0, arriveTime]];
}, 326)

// Grove's Edge
arriveLead = Math.max(arriveTime - 0.1, 0);

noteSection(358, 390, undefined, [
    [0, x => {
        x.rotation = [[-3, -5, -45, arriveLead], [0, 0, 0, arriveTime]];
        x.position = [[0, 0, 200, 0], [0, 0, 0, arriveTime, EASE.IN_EXPO]];
        x.dissolve = [[0, arriveLead], [1, arriveTime]];
        x.dissolveArrow = [[0, arriveTime - 0.1], [1, arriveTime]];
    }]
], {
    function: x => {
        x.rotation = [[-3, -5, -45, arriveLead], [-2.5, 0, 0, arriveTime]];
        x.position = [[0, 0, 200, 0], [0, -0.125, 0, arriveTime, EASE.IN_EXPO]];
    }
})

// Sunless Grove

noteSection(390, 422, {
    function: x => {
        x.rotation = [[-13, -8, -45, 0], [-15, -4, -45, 0.25, EASE.IN_OUT_SINE], [-2.5, 0, 0, arriveTime, EASE.IN_OUT_SINE]];
        x.position = [[0, 0, 500, 0], [0, -0.125, 0, arriveTime, EASE.IN_CUBIC]];
        x.dissolve = [[0, 0], [1, arriveTime]];
        x.dissolveArrow = [[0, arriveTime - 0.1], [1, arriveTime]];
    }
}, [
    [0, x => {
        x.rotation = [[-13, -8, -45, 0], [-15, -4, -45, 0.25, EASE.IN_OUT_SINE], [-5, 0, 0, arriveTime, EASE.IN_OUT_SINE]];
        x.position = [[0, 0, 500, 0], [0, -0.25, 0, arriveTime, EASE.IN_CUBIC]];
    }],
    [1, x => {
        x.rotation = [[-13, -8, -45, 0], [-15, -4, -45, 0.25, EASE.IN_OUT_SINE], [-10, 0, 0, arriveTime, EASE.IN_OUT_SINE]];
        x.position = [[0, 0, 500, 0], [0, -0.25, 0, arriveTime, EASE.IN_CUBIC]];
    }]
])

pathNotes(x => {
    x.dissolve = [0];
    x.dissolveArrow = [[0, 0.45], [1, 0.49]];
}, 404)

pathNotes(x => {
    x.dissolve = [[0, 0], [1, arriveTime]];
    x.dissolveArrow = [[0, arriveTime - 0.1], [1, arriveTime]];
}, 406)

// Entrance
arriveTime = getArriveTime(8);

noteSection(422, 454, {
    function: x => {
        x.position = [[0, 0, 800, 0], [0, -0.25, 0, 0.5, EASE.IN_OUT_SINE]];
        x.dissolve = [[0, 0], [1, 0.05]];
        x.dissolveArrow = [[0, 0], [1, 0.05]];
        x.rotation = [[3, -18, -3, 0], [5, -13, 4, 0.3, EASE.OUT_SINE], [-10, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }
}, [
    [0, x => {
        x.rotation = [[3, -18, -3, 0], [5, -13, 4, 0.3, EASE.OUT_SINE], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_CUBIC],
            [0, 0, 0, 0.5, EASE.OUT_CUBIC]
        ];
    }]
], {
    function: x => {
        x.rotation = [[3, -18, -3, 0], [5, -13, 4, 0.3, EASE.OUT_SINE], [-40, 0, 0, 0.5, EASE.IN_OUT_SINE]]
        x.position = [
            [0, 0, 800, 0],
            [0, -0.75, getCurveDist(800, arriveTime), arriveTime, EASE.IN_CUBIC],
            [0, -0.75, 0, 0.5, EASE.OUT_CUBIC]
        ];
    }, time: 8, ease: EASE.IN_OUT_SINE
})

// Outskirts
noteSection(454, 470, undefined, [
    [0, x => {
        x.rotation = [[-29, -6, 0, 0.3], [-40, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }]
], {
    function: x => {
        x.rotation = [[-29, -6, 0, 0.3], [-20, 0, 0, 0.5, EASE.IN_OUT_SINE]];
        x.position = [
            [0, 0, 800, 0],
            [0, -0.75 / 2, getCurveDist(800, arriveTime), arriveTime, EASE.IN_CUBIC],
            [0, -0.75 / 2, 0, 0.5, EASE.OUT_CUBIC]
        ];
    }, time: 15, ease: EASE.IN_OUT_SINE
})

// Outskirts (Alt 1)
pathNotes(x => {
    x.rotation = [[-24, -6, 0, 0.3], [-20, 0, 0, 0.5, EASE.IN_OUT_SINE]];
}, 470);

pathNotes(x => {
    x.rotation = [[-24, -6, 0, 0.3], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    x.position = [
        [0, 0, 800, 0],
        [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_CUBIC],
        [0, 0, 0, 0.5, EASE.OUT_CUBIC]
    ];
}, 471, 7, EASE.IN_OUT_SINE);

// Outskirts (Alt 2)
pathNotes(x => {
    x.rotation = [[0, -8, -3, 0.3], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
}, 478)

// Outskirts (Alt 3)
pathNotes(x => {
    x.rotation = [
        [-5, 0, 0, 0],
        [-1, -4, 0, 0.2, EASE.IN_OUT_SINE],
        [4, 2, 0, 0.4, EASE.IN_OUT_SINE],
        [0, 0, 0, 0.5, EASE.IN_OUT_SINE]
    ];
}, 486)

// Powerlines
pathNotes(x => {
    x.dissolve = [[0, 0.3], [1, 0.35]];
    x.dissolveArrow = [[0, 0.3], [1, 0.35]];
    x.rotation = [[2, 0, 0, 0.3], [0, 0, 0, 0.45, EASE.OUT_BACK]];
}, 518)

animateNotes(x => {
    x.dissolve = [0];
}, 0, 0, undefined, "drop");

animateNotes(x => {
    x.dissolve = [[0, 0], [1, 0.5]];
}, 549.5, 0.5, undefined, "drop");

animateNotes(x => {
    x.dissolve = [0];
    x.dissolveArrow = [0];
}, 0, 0, undefined, "drop2");

animateNotes(x => {
    x.dissolve = [1];
    x.dissolveArrow = [1];
}, 550, 0, undefined, "drop2");

// HELIOV
arriveTime = getArriveTime(4);

noteSection(550, 582, {
    function: x => {
        x.dissolve = [[0, 0], [1, 0.05]];
        x.dissolveArrow = [[0, 0], [1, 0.05]];
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_CUBIC],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [0, 0, 0];
    }
}, [
    [0, x => {
        x.rotation = [[-30, 0, 0, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }]
], {
    function: x => {
        x.rotation = [[-30, 0, 0, 0], [0, 0, 0, 0.4, EASE.IN_OUT_SINE]];
    }
})

// ABYSS
noteSection(582, 606, {
    function: x => {
        x.position = [
            [0, -20, 2000, 0],
            [0, getCurveDist(-20, arriveTime), getCurveDist(2000, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [
            [7, -3, 180, 0],
            [0, 0, 0, 0.5, EASE.IN_OUT_SINE]
        ];
    }
}, [
    [0, x => {
        x.position = [
            [0, -20, 800, 0],
            [0, getCurveDist(-20, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }]
], {
    function: x => {
        x.rotation = [0, 0, 0];
        x.position = [[0, 0, 200, 0], [0, 0, 0, 0.5, EASE.OUT_EXPO]];
    }, time: 5
})

// ABYSS (transition)
noteSection(606, 614, {
    function: x => {
        x.position = [[0, 0, -100, 0], [0, 0, 0, 0.5, EASE.OUT_EXPO]];
        x.rotation = [[7, -3, 180, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
        x.dissolve = [1];
        x.dissolveArrow = [1];
    }, time: 6
}, [
    [0, x => {
        x.dissolve = [[0, 0.45], [0.2, 0.5]];
        x.dissolveArrow = [1];
        x.position = [0, 0, 0];
        x.rotation = [[-2, 0, 0, 0], [0, 0, 0, 0.5]];
    }]
])

// CUBIC
noteSection(614, 622, {
    function: x => {
        x.dissolve = [[0, 0], [1, 0.05]];
        x.dissolveArrow = [[0, 0], [1, 0.05]];
    }, time: 4
}, [
    [0, x => {
        x.position = [
            [0, -20, 800, 0],
            [0, getCurveDist(-20, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[0, 3, 180, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }]
], {
    function: x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }, time: 4
})

// TRIANGLE COMPLEX
noteSection(622, 630, {
    function: x => {
        x.position = [
            [0, -10, 800, 0],
            [0, getCurveDist(-10, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[0, 0, 360, 0], [0, 0, 180, 0.25], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }, time: 4
}, [
    [0, x => {
        x.position = [
            [0, -60, 800, 0],
            [0, getCurveDist(-60, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }]
], {
    function: x => {
        x.position = [
            [0, -10, 800, 0],
            [0, getCurveDist(-10, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }, time: 4
})

// DISTANCE
startRot = [
    [-5, 0, 0, 0],
    [-1, -4, 0, 0.2, EASE.IN_OUT_SINE],
    [4, 2, 0, 0.4, EASE.IN_OUT_SINE],
    [0, 0, 0, 0.5, EASE.IN_OUT_SINE]
];
transitions = makeTransitions([-10.2, -4.28, -1.42], [-13, -2.69, -2.53], [-15.9, -1.05, -3.68], startRot, undefined, 1);

noteSection(630, 638, {
    function: x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 1, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = transitions.in;
    }, time: 4
}, [
    [0, x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = startRot;
    }]
], {
    function: x => {
        x.rotation = transitions.out;
    }, time: 4
})

// REACH
noteSection(638, 646, {
    function: x => {
        x.position = [
            [0, -70, 800, 0],
            [0, getCurveDist(-70, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[7, -10, 180, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }, time: 4
}, [
    [0, x => {
        x.position = [
            [0, -20, 800, 0],
            [0, getCurveDist(-20, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[7, -3, 180, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }]
], {
    function: x => {
        x.position = [
            [0, -70, 800, 0],
            [0, getCurveDist(-70, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }, time: 4
})

// RUIN
startRot = [
    [10, 0, 0, 0],
    [8, -1, 0, 0.1, EASE.IN_OUT_SINE],
    [6, 2, 0, 0.2, EASE.IN_OUT_SINE],
    [4, -3, 0, 0.3, EASE.IN_OUT_SINE],
    [2, 4, 0, 0.4, EASE.IN_OUT_SINE],
    [0, 0, 0, 0.5, EASE.IN_OUT_SINE]
];
transitions = makeTransitions([-8.62, 2.36, 9.42], [-2.89, 1.34, 4.75], [2.84, 0.305, 0.0246], startRot, undefined, 2)

noteSection(646, 654, {
    function: x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 5, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = transitions.in;
    }, time: 4
}, [
    [0, x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = startRot;
    }]
], {
    function: x => {
        x.rotation = transitions.out;
    }, time: 4, ease: EASE.IN_QUAD
})

// BEAMS
noteSection(654, 662, {
    function: x => {
        x.rotation = [[7, 3, 90, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
        x.position = [
            [0, 50, 800, 0],
            [0, getCurveDist(50, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }, time: 4
}, [
    [0, x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }]
], {
    function: x => {
        x.position = [
            [0, -50, 800, 0],
            [0, getCurveDist(-50, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }, time: 4
})

// BADLANDS
noteSection(662, 670, {
    function: x => {
        x.position = [
            [0, 2, 800, 0],
            [0, 2, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[0, -10, -90, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }, time: 3
}, [
    [0, x => {
        x.position = [
            [0, -60, 1000, 0],
            [0, getCurveDist(-60, arriveTime), getCurveDist(1000, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
    }],
], {
    function: x => {
        x.rotation = [[0, -10 + 5, -90, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }, time: 5, ease: EASE.IN_EXPO
})

// VALLEY
noteSection(670, 678, {
    function: x => {
        x.position = [
            [0, -30, 800, 0],
            [0, getCurveDist(-30, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[20, -6, -90, 0], [0, 0, 0, 0.5]];
    }, time: 3
}, [
    [0, x => {
        x.position = [
            [0, -10, 800, 0],
            [0, getCurveDist(-10, arriveTime), getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[20, 0, -90, 0], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }]
], {
    function: x => {
        x.rotation = [[20, 4, -90, 0], [0, 0, 0, 0.5]];
    }, time: 5
})

// AFTERMATH
arriveTime = getArriveTime(5);

noteSection(678, 709, {
    function: x => {
        x.position = [
            [0, 0, 800, 0],
            [0, 0, getCurveDist(800, arriveTime), arriveTime, EASE.IN_QUINT],
            [0, 0, 0, 0.5, EASE.OUT_QUINT]
        ];
        x.rotation = [[3, 0, -3, 0], [5, -5, 4, 0.3, EASE.OUT_SINE], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }, time: 3
}, [
    [0, x => {
        x.rotation = [[3, -10, -3, 0], [5, -5, 4, 0.3, EASE.OUT_SINE], [0, 0, 0, 0.5, EASE.IN_OUT_SINE]];
    }]
])
//#endregion

//#region //! Output

// Deleting data used for scripting
map.environment.forEach(x => {
    if (x.json.follow) delete x.json.follow;
})

// Trimming animations to not have a duration that exceeds the animation
// This optimization was actually so good it got added to Heck!!
map.customEvents.forEach(e => {
    if (e.type === "AnimateTrack") {
        const event = e as CustomEventInternals.AnimateTrack;
        const data = event.data as Record<string, any>;
        const animationKeys = [];
        let max = 0;

        if (!data._duration || data._duration === 0) return;

        Object.keys(data).forEach(key => {
            if (
                key !== "_track" &&
                key !== "_duration"
            ) {
                animationKeys.push(key);
                const animation = complexifyArray(data[key]) as KeyframeArray;
                animation.forEach(x => {
                    const time = new Keyframe(x).time;
                    if (time > max) max = time;
                })
            }
        })

        if (max === 0) {
            delete data._duration;
            return;
        }

        if (max < 1) {
            data._duration *= max;
            animationKeys.forEach(key => {
                if (!isSimple(data[key])) {
                    const animation = data[key] as KeyframeArray;
                    animation.forEach(x => {
                        const timeIndex = new Keyframe(x).timeIndex;
                        (x[timeIndex] as number) /= max;
                    })
                }
            })
        }
    }
})

// Combines environment hiding events into one event. 
// This will be included out of the box with ReMapper eventually, along with the rest of the optimizations.
if (isRelease) {
    let yeetTime = 0;
    let yeetEvent: CustomEventInternals.AnimateTrack;

    map.customEvents.sort((a, b) => a.time - b.time);

    for (let i = 0; i < map.customEvents.length; i++) {
        if (map.customEvents[i].type === "AnimateTrack") {
            const e = map.customEvents[i] as CustomEventInternals.AnimateTrack;
            if (e.animate.position !== "yeet") continue;
            const track = copy(e.track.value as string);
            if (e.time !== yeetTime) {
                yeetTime = e.time;
                yeetEvent = e;
                e.trackSet = [track];
            }
            else {
                (yeetEvent.track.value as string[]).push(track);
                e.data.deleted = true;
            }
        }
    }

    map.customEvents = map.customEvents.filter(x => !x.data.deleted);
}

// Runs per difficulty to do some note specific stuff and configuration stuff.
function exportMap(diff: Difficulty) {
    diff.NJS = 14;
    diff.require(MODS.CHROMA);
    diff.require(MODS.NOODLE_EXTENSIONS)
    diff.settings = PRESET.MODCHART_SETTINGS;
    diff.setSetting("_countersPlus._mainEnabled", false);
    diff.setSetting("_uiTweaks._multiplierEnabled", false);
    diff.setSetting("_uiTweaks._comboEnabled", false);
    diff.setSetting("_uiTweaks._energyEnabled", false);
    diff.setSetting("_uiTweaks._positionEnabled", false);
    diff.setSetting("_uiTweaks._progressEnabled", false);
    if (!isRelease) {
        delete diff.settings._modifiers._noFailOn0Energy;
        diff.settings = diff.settings;
    }

    diff.notes.forEach(x => {
        Object.keys(x.customData).forEach(y => {
            if (y !== "_animation") delete x.customData[y];
        })

        Object.keys(x.animation).forEach(y => {
            delete x.animation[y];
        })

        x.trackSet = "note";
        x.spawnEffect = false;
        x.offset = offset;
    });

    // Chasm
    notesBetween(102, 166, x => {
        x.NJS = 16;
    })

    // Underworld
    notesBetween(294, 422, x => {
        x.NJS = 18;
    })

    // Powerlines
    notesBetween(550, 551, x => {
        x.trackSet = ["note", "drop"];
    })

    notesBetween(551, 709, x => {
        x.trackSet = ["note", "drop2"];
    })
}

// Transfers script to expert diff and saves map.
if (isRelease) transferVisuals(["ExpertStandard.dat"], x => { exportMap(x) });
exportMap(map);
map.save();

// Trims decimals because node is stupid and won't actually save to JSON with trimmed decimals. I literally have to use deno LMAO.
if (isRelease) {
    exec("deno run --allow-all .\\decimal_reducer.ts", (_e, result) => {
        console.log(result);
        exportZip(["EasyLawless.dat"]);
    })
}
//#endregion