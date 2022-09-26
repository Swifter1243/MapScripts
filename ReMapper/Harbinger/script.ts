// deno-lint-ignore no-unused-vars
import { arrAdd, cacheData, ComplexKeyframesVec3, CustomEvent, CustomEventInternals, Difficulty, EASE, Environment, Event, EVENT, exportZip, Geometry, jsonSet, KeyframesLinear, KeyframesVec3, lerp, lerpEasing, lerpRotation, LightRemapper, ModelObject, ModelScene, PRESET, rand, RawKeyframesVec3, Regex, rotatePoint, settings, transferVisuals, Vec3 } from "https://deno.land/x/remapper@2.1.0/src/mod.ts"
import { Perlin } from "./perlin.js";

const map = new Difficulty("ExpertPlusLawless", "ExpertPlusStandard");
let env: Environment;
let animTrack: CustomEventInternals.AnimateTrack;

const release = false;

//#region //! Fog
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

const lastDropOut = 10;

fogAttentuation(0, [1 / 20000]);
fogAttentuation(197 - 2, [[1 / 20000, 0], [1 / 10000, 1, "easeInOutExpo"]], 4);
fogAttentuation(229, [1 / 20000]);
fogAttentuation(293, [1 / 800000]);
fogAttentuation(421, [[1 / 800000, 0], [1 / 20000, 1]], 8)
fogAttentuation(453, [1 / 100000])
fogAttentuation(517, [1 / 2000]);
fogAttentuation(645, [[1 / 2000, 0], [1 / 1000, 1, "easeInExpo"]], lastDropOut);
fogAttentuation(645 + lastDropOut, [[1 / 1000, 0], [1 / 70000, 1, "easeOutExpo"]], lastDropOut * 3)

//#endregion
//#region //! Environment

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

env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

env = new Environment("Waterfall$", "Regex");
env.scale = [100, 1, 3];
env.position = [0, 0, -50]
env.push();

const sunSize = 20;
const sunPos = [500, 3000] as [number, number];
const flareID = new Regex("Sun").separate().add("NeonTube").vary(2).end();
const flareDist = 400;
const flareAmount = 60;
const flareSize = 20;

env = new Environment("Sun$", "Regex");
env.scale = [1, 1, 1].map(x => x * sunSize) as Vec3;
env.position = [0, ...sunPos]
env.track = "sun"
env.push();

env = new Environment(flareID, "Regex")
env.scale = [2, 0.25, 1].map(x => x * 20 / sunSize) as Vec3;
env.track = "horizonFlare"
env.push();

animTrack = new CustomEvent(517).animateTrack("sun");
animTrack.animate.position = [0, 0, sunPos[1]];
animTrack.push();

animTrack = new CustomEvent(517).animateTrack("horizonFlare");
animTrack.animate.scale = [3, 2, 1].map(x => x * 20 / sunSize) as Vec3;
animTrack.push();

delete env.json._track;
env.duplicate = 1;
env.lightID = 100;
env.scale = [1, 0.5, 1].map(x => x * 20 / sunSize) as Vec3;
env.rotation = [0, 0, 90];
env.position = [-flareDist, ...sunPos];
env.push();
env.position = [flareDist, ...sunPos];
env.push();

env.lightID = 200;

const circleFlares: number[] = [];

for (let r = 0; r < 360; r += 360 / flareAmount) {
    const proximity = Math.abs(Math.max(
        90 - r,
        r - 270
    )) / 90;

    if (proximity === 0) continue;

    const rotation: Vec3 = [0, 0, r];
    env.scale = [1 / 1000, 3 * flareSize * proximity, 1 * flareSize * proximity].map(x => x / sunSize) as Vec3;
    env.rotation = rotation;
    env.position = arrAdd(rotatePoint(rotation, [flareDist, 0, 0]), [0, ...sunPos]) as Vec3;
    env.push();

    circleFlares.push(200 + circleFlares.length)
}

//#endregion
//#region //! Lights

/*
? ROTATING LASERS: LEFT AND RIGHT LASERS
? BLOOM LASERS: WATER 2 ID 1-4
? SOLID LASERS: LEFT SUNBEAMS ID 1-8
? HORIZON FLARE: WATER 3 ID 1
? SIDE FLARES: WATER 3 ID 2
? CIRCLE FLARES: WATER 3 ID 3
*/

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

new LightRemapper().type(6).range([1, 4]).setType(1).addToEnd(99).run(); // Bloom Lasers
new LightRemapper().type(2).range([1, 8]).setType(6).addToEnd(199).run(); // Solid Lasers
new LightRemapper().type(7).IDs([1]).setType(EVENT.CENTER_LASERS).setIDs(4).multiplyColor(1, 2.5).run(); // Horizon Flare
new LightRemapper().type(7).IDs([2]).setType(EVENT.CENTER_LASERS).setIDs([100, 101]).multiplyColor(1, 1.5).run(); // Side Flares
new LightRemapper().type(7).IDs([3]).setType(EVENT.CENTER_LASERS).setIDs(circleFlares).multiplyColor(1, 0.5).run(); // Side Flares

//#endregion
//#region //! Mountains
const pn = new Perlin("balls lol");

const resolution = 1.7;
const mountStep = 60 / resolution; // Size of steps
const mountSize = 20 * resolution; // Amount of steps outward to create mountain

const lean = 60;
const leanEase: EASE = "easeInSine"

const playerWidth = 70;

const params = {
    steepness: 2,
    smoothness: 0.12,
    noiseStrength: 7
}

type MountainParams = typeof params;
type Vec2 = [number, number]

const getDist = (A: Vec3, B: Vec3) => Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2) + Math.pow(B[2] - A[2], 2));

function lookAt(pos: Vec2, target: Vec2) {
    target = target.map((x, i) => x - pos[i]) as Vec2;
    return Math.atan2(target[1], target[0]) * (180 / Math.PI);
}

let visualObjects = 0;

function getMountain(pos: Vec3, params: MountainParams, left: boolean) {
    const objs: SimpleObject[] = [];
    const range = mountSize * mountStep;
    const maxDist = getDist([range, 0, 0], [0, 0, 0])

    for (let x = left ? -range : 0; x <= (left ? 0 : range); x += mountStep) for (let z = -range; z <= range; z += mountStep) {
        const objPos = arrAdd([x, 0, z], pos) as Vec3;
        const noiseX = x / params.smoothness / range;
        const noiseZ = z / params.smoothness / range;
        const noiseVal = pn.noise(noiseX, 0, noiseZ);
        const proximity = Math.max(1 - (getDist([x, 0, z], [0, 0, 0]) / maxDist), 0);

        if (proximity === 1) continue;

        let strength = 0;
        strength += (noiseVal - 0.5) * params.noiseStrength
        strength += lerpEasing("easeInExpo", proximity) * params.steepness
        strength *= proximity

        const width = strength * range / 50 * 2;

        if (objPos[0] < width + playerWidth && objPos[0] > -width - playerWidth) continue;

        const isSpawned = Math.random() < strength;

        if (isSpawned) {
            visualObjects++;
            const angle = (lookAt([-x, z], [0, 0]) - 90) % 360;
            const rotX = lean * (1 - lerpEasing(leanEase, proximity));

            objs.push({
                pos: objPos,
                scale: [1, 20 * proximity, 1].map(x => x * width) as Vec3,
                rot: [rotX, angle, 0]
            })
        }
    }

    return objs;
}

const popIn = 2700; // Position to spawn in objects
const popOut = -40; // Position to spawn out objects
const scrollStart = 517;
const scrollEnd = 517 + 128;

type SimpleObject = {
    pos: Vec3,
    rot: Vec3,
    scale: Vec3
}

type RegisteredObject = {
    obj: SimpleObject,
    pos: ComplexKeyframesVec3,
    rot: ComplexKeyframesVec3,
    scale: ComplexKeyframesVec3,
    availableAt: number
}

// This function is half baked because shit gets messed up at the end
// So I just cut it off LMAO
function scrollModel(objects: SimpleObject[]) {
    if (objects.length === 0) return { objects: objects as ModelObject[], dur: 0 }

    objects = objects.sort((a, b) => a.pos[2] - b.pos[2])
    const rawMaxZ = objects[objects.length - 1].pos[2];
    const maxZ = rawMaxZ + (popIn * 4);
    const registered: RegisteredObject[] = [];
    const getTime = (z: number) => Math.min(z / rawMaxZ, 1);

    // Gets the total time the object will be used
    function getLife(z: number) {
        let life = z;
        if (z > popIn) life = popIn;
        if (isLastBatch(z)) life = z % popIn;
        return life;
    }

    const isLastBatch = (z: number) => z / popIn > Math.floor(rawMaxZ / popIn);

    function iterate(z: number, obj: RegisteredObject) {
        if (isLastBatch(z)) return

        const startZ = getTime(z - getLife(z));
        const endZ = getTime(z);

        const startPos = z > popIn ? popIn : obj.obj.pos[2];
        const endPos = isLastBatch(z) ? z % popIn : 0;
        obj.pos.push([obj.obj.pos[0], obj.obj.pos[1], startPos + popOut, startZ, "easeStep"] as ComplexKeyframesVec3[0]);
        obj.pos.push([obj.obj.pos[0], obj.obj.pos[1], endPos + popOut, endZ]);
        if (startZ === 0) {
            obj.rot.push([...obj.obj.rot, startZ, "easeStep"] as ComplexKeyframesVec3[0]);
            obj.scale.push([...obj.obj.scale, startZ] as ComplexKeyframesVec3[0]);
        }
        else {
            const randLerp = rand(0.2, 0.4);
            obj.rot.push([obj.obj.rot[0] / 2, obj.obj.rot[1], 0, startZ, "easeStep"] as ComplexKeyframesVec3[0]);
            obj.rot.push([...obj.obj.rot, lerp(startZ, endZ, randLerp), "easeOutExpo"] as ComplexKeyframesVec3[0]);
            obj.scale.push([0, obj.obj.scale[1], 0, startZ, "easeStep"] as ComplexKeyframesVec3[0]);
            obj.scale.push([...obj.obj.scale, lerp(startZ, endZ, randLerp), "easeOutExpo"] as ComplexKeyframesVec3[0]);
        }
    }

    if (rawMaxZ <= popIn) return { objects: objects as ModelObject[], dur: 0 }

    objects.forEach(x => {
        const z = x.pos[2];
        let obj = registered.find(r => r.availableAt < z - getLife(z));

        if (obj) {
            obj.obj = x;
            obj.availableAt = z;
        }
        else {
            obj = {
                obj: x,
                pos: [],
                rot: [],
                scale: [],
                availableAt: z
            }
            registered.push(obj);

            if (z > popIn) obj.pos.push([0, -69420, 0, 0]);
        }

        iterate(z, obj);
    })

    const output: ModelObject[] = []
    registered.forEach(x => {
        const obj: ModelObject = {
            pos: x.pos,
            rot: x.rot,
            scale: x.scale
        };
        output.push(obj);
    })

    return {
        objects: output,
        maxZ: maxZ,
        dur: (scrollEnd - scrollStart) * (maxZ / rawMaxZ)
    }
}

const mountDist = 12000;
const mountInterval = 250 * 5;
const mountPos: Vec2 = [1000, 1300];

let mountains: SimpleObject[] = []

let left = true;

for (let z = 0; z <= mountDist; z += mountInterval) {
    const s = left ? 1 : -1;
    left = !left;
    const x = rand(...mountPos) * s;
    mountains = mountains.concat(getMountain([x, 0, s === 1 ? z : z + mountInterval / 2], {
        steepness: rand(0, 0.3),
        smoothness: rand(0.01, 0.12),
        noiseStrength: rand(4, 10)
    }, s === 1))
}

const scroll = scrollModel(mountains);

// console.log("VISUAL AMOUNT: " + visualObjects)
// console.log("TRUE AMOUNT: " + scroll.objects.length)

//#endregion
//#region //! Model

const scene = new ModelScene(new Geometry("Cube", "standard"));
scene.addPrimaryGroups("cloud", new Geometry("Sphere", "standard"));
scene.assignObjects(rotatingLights, undefined, [0, 1.75, 2]);
scene.assignObjects(lights, BLOOM_LIGHT.SCALE);
scene.animate([
    ["first", 0],
    [{
        input: scroll.objects,
        bake: false
    }, scrollStart, scroll.dur],
    ["second", scrollEnd + lastDropOut]
]);

//#endregion
//#region //! Export
if (!release) settings.decimals = undefined;

function exportMap(diff: Difficulty) {
    diff.geoMaterials["standard"] = {
        _shader: "Standard"
    }

    diff.require("Chroma");
    diff.require("Noodle Extensions", false)
    diff.rawSettings = PRESET.CHROMA_SETTINGS;
    diff.settings.mirrorQuality = "HIGH";
    diff.settings.smoke = false;
    diff.settings.noHud = true;
    diff.notes.forEach(x => {
        x.spawnEffect = false;
    })
}

exportMap(map);
map.save();
transferVisuals(["ExpertStandard.dat", "HardStandard.dat"], x => { exportMap(x) });
exportZip(["ExpertPlusLawless"]);
//#endregion