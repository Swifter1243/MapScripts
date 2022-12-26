import { adjustFog, copy, CustomEventInternals, Color, Difficulty, Environment, Event, Geometry, info, LightRemapper, ModelScene, Regex, Track, Vec3, AnimatedObjectInput, PRESET, lerp, rand, isSimple, RawKeyframesAny, RawKeyframesVec3, ComplexKeyframesVec3, Keyframe, arrEqual, complexifyArray, arrMul, ColorType, exportZip } from "https://deno.land/x/remapper@3.1.1/src/mod.ts" // MAKE SURE THIS IS ON THE LATEST REMAPPER VERSION!!!!!!!!!

const map = new Difficulty("ExpertPlusLawless", "EasyStandard");
let env: Environment | Geometry;
let animTrack: CustomEventInternals.AnimateTrack;

// SCRIPT

const SONGEND = 369.693;

adjustFog(x => {
    x.attenuation = 0.01;
})

//! Environment

// Removal
function remove(ids: string[], regex = false) {
    const env = new Environment(undefined, regex ? "Regex" : undefined);
    env.active = false;

    ids.forEach(x => {
        env.id = x;
        env.push();
    })
}

remove([
    "Smoke",
    "WaterRainRipples",
    "RectangleFakeGlow",
    "Mirror",
    "Clouds"
])

env = new Environment("Rail");
env.position = [0, -69420, 0];
env.push();

env = new Environment("Waterfall$", "Regex");
env.scale = [100, 1, 3];
env.position = [0, 0, -50]
env.push();

//! Model

const trackArr = (base: string, length: number) => Array.from({ length: length }, (_, i) => base + (i + 1));

const scene = new ModelScene(new Geometry("Cube", {
    shader: "BTSPillar"
}));

scene.addPrimaryGroups("sphere", new Geometry("Sphere", {
    shader: "BTSPillar"
}))

// Smoke

env = new Environment("BigSmokePS", "EndsWith");
env.track.value = "smoke";
env.active = true;
env.push();

const smokeSize = 0.04;
scene.assignObjects("smoke", [smokeSize, smokeSize, smokeSize]);

// Stars

const starID = 1000;

env = new Geometry("Cube", {
    shader: "TransparentLight"
})
env.components.TubeBloomPrePassLight = {
    colorAlphaMultiplier: 10
}
env.lightType = 0;
env.lightID = starID;

scene.addPrimaryGroups("star", env);

// Flare

const FLARE_TRANSFORM: Vec3[] = [
    [1 / 20, 1 / 10, 1 / 20]
]

let flareID = 1000;
env = new Environment(new Regex("Sun").separate().add("NeonTube").vary(2).end(), "Regex");
env.lightType = 1;
env.lightID = flareID;
env.components.TubeBloomPrePassLight = {
    colorAlphaMultiplier: 150,
    bloomFogIntensityMultiplier: 300
}

scene.addPrimaryGroups("flare", env, ...FLARE_TRANSFORM);

// Flowers

let flowerID = 1000;
const flowerAmount = 6;

env = new Geometry("Cube", {
    shader: "OpaqueLight"
});
env.lightType = 2;
env.components.TubeBloomPrePassLight = {
    bloomFogIntensityMultiplier: 10,
    colorAlphaMultiplier: 10
}
env.lightID = flowerID;

scene.addPrimaryGroups(trackArr("flowers", flowerAmount), env);

// Fireflies

const fireFlyID = 1000;

env = new Geometry("Cube", {
    shader: "TransparentLight"
})
env.components.TubeBloomPrePassLight = {
    colorAlphaMultiplier: 200,
    bloomFogIntensityMultiplier: 0.01
}
env.lightType = 3;
env.lightID = fireFlyID;

scene.addPrimaryGroups("firefly", env);

// Bloom lights

const bloomID = 1000;
const bloomLights = 6;

const baseLightID = (vary = 0) => new Regex("LightRailingSegment").vary(vary).separate().add("NeonTubeDirectionalL").string;

const BLOOM_LIGHT = {
    ID: baseLightID() + "$",
    SCALE: <Vec3>[1, 0.2, 1]
}

env = new Environment(new Regex(baseLightID()).separate().add("BoxLight").end(), "Regex");
env.active = false;
env.push();

env = new Environment(baseLightID() + "$", "Regex");
env.components.TubeBloomPrePassLight = {
    bloomFogIntensityMultiplier: 5
}
env.lightType = 4;
env.lightID = bloomID;
scene.addPrimaryGroups(["horizon", ...trackArr("laser", bloomLights)], env, BLOOM_LIGHT.SCALE);

// Tree lights

const glowID = 1000;

env = new Geometry("Cube", {
    shader: "OpaqueLight"
})
env.components.TubeBloomPrePassLight = {
    colorAlphaMultiplier: 10
}
env.lightType = 6;
env.lightID = glowID;

scene.addPrimaryGroups("glow", env);

// Model

const checkTrack = (track: Track, value: string) => track.array[0].split("_")[1] === value;

function random(start: number, end: number, seed: number) { // Seeded random
    const x = Math.sin(seed) * 10000;
    const rand = x - Math.floor(x);
    return lerp(start, end, rand);
}

const skyColor: Record<number, Vec3> = {};

scene.animate([[{
    input: "env",
    mirror: true,
    loop: Math.round(SONGEND / 20)
} as AnimatedObjectInput, 0, SONGEND]], x => {
    if (checkTrack(x.track, "flare")) {
        const color = new Color([random(0.45, 0.6, flareID), 0.8, 1], "HSV").export();
        skyColor[flareID] = color as Vec3;
        flareID++;
    }
});

// Mirrored animations for static objects causing lots of lag. 
// This is a bandaid to remove those events until I fix it in RM.
map.animateTracks(arr => {
    for (let i = 0; i < arr.length; i++) {
        const x = arr[i];
        if (x.track.array.some(x => x.includes("modelScene"))) {
            const pos = x.animate.position as ComplexKeyframesVec3;
            const k1 = new Keyframe(pos[0]);
            const k2 = new Keyframe(pos[1]);
            if (arrEqual(k1.values, k2.values)) {
                const rot = x.animate.rotation as ComplexKeyframesVec3;
                const scale = x.animate.scale as ComplexKeyframesVec3;
                x.animate.position = new Keyframe(complexifyArray(pos)[0]).values as Vec3;
                x.animate.rotation = new Keyframe(complexifyArray(rot)[0]).values as Vec3;
                x.animate.scale = new Keyframe(complexifyArray(scale)[0]).values as Vec3;
                x.repeat = 0;
            }
        }
    }
})

//! Lights

/*
? SKY - [WATER 4]
? HORIZON - [WATER 1]
? BLOOM LIGHTS - [LEFT SUNBEAMS]
? FLOWER GROUPS - [RIGHT SUNBEAMS 1 - 6]
? TREE LIGHTS - SUN
*/

const fillArr = (base: number, length: number) => Array.from({ length: length }, (_, i) => (i + base));

// Sky

const starIDs = fillArr(starID, scene.objectInfo.star.max);

new LightRemapper().type(0).addProcess(x => {
    const event = copy(x);
    const hsv = x.color ? new Color(x.color, "RGB") : new Color([0, 0, 0], "RGB");
    hsv.toFormat("HSV");
    const brightness = x.color ? hsv.value[3] : undefined;

    Object.entries(skyColor).forEach(y => {
        const ID = y[0];
        const color = y[1];
        event.lightID = parseInt(ID);

        if (brightness) {
            event.color = arrMul(color, brightness) as ColorType;
            if (x.color[3] !== undefined) event.color[3] = x.color[3];
        }

        event.type = 1;
        event.push();
    })
}).setIDs(starIDs).run();

// Horizon

new LightRemapper(x => !x.lightID).type(1).setType(4).initIDs(bloomID).run();

// Bloom lights

new LightRemapper().type(2).setType(4).addToEnd(bloomID).run();

// Flower groups

const flowerIDs: Record<number, number[]> = {};

for (let i = 1; i <= flowerAmount; i++) {
    const track = `flowers${i}`;
    const max = scene.objectInfo[track].max;
    flowerIDs[i] = fillArr(flowerID, scene.objectInfo[track].max);
    flowerID += max;
}

new LightRemapper().type(3).addProcess(x => {
    if (x.lightID === 3 && x.color) x.color = arrMul(x.color, [0.8, 0.8, 0.8, 1]);
    x.lightID = flowerIDs[x.lightID as number];
}).setType(2).run();

// Fireflies

const fireFlyIDs = fillArr(fireFlyID, scene.objectInfo.firefly.max);

const fireFlyRate = 20;

fireFlyIDs.forEach(x => {
    for (let i = 0; i < SONGEND; i += fireFlyRate) {
        const time = i + rand(0, fireFlyRate);
        new Event(time).setType(3).fade([1, 1, 0], x).push();
    }
})

// Tree lights

new LightRemapper(x => !x.lightID).type(4).setIDs(fillArr(fireFlyID, scene.objectInfo.glow.max)).setType(6).run();


// EXPORT

map.notes.forEach(x => {
    x.spawnEffect = false;
})

map.rawSettings = PRESET.CHROMA_SETTINGS;
map.settings.mirrorQuality = "HIGH";
map.settings.smoke = true;
map.settings.noHud = true;

info.environment = "BillieEnvironment";
map.require("Chroma");
map.require("Noodle Extensions", false);
map.save();
exportZip(["ExpertPlusLawless"]);