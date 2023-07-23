import { exportZip } from 'https://deno.land/x/remapper@3.1.2/src/beatmap.ts'
import { LightRemapper } from 'https://deno.land/x/remapper@3.1.2/src/light_remapper.ts'
import {
    ComplexKeyframesLinear,
    ComplexKeyframesVec3,
    getValuesAtTime,
} from 'https://deno.land/x/remapper@3.1.2/src/animation.ts'
import {
    copy,
    lerp,
    lerpEasing,
    round,
    Vec4,
} from 'https://deno.land/x/remapper@3.1.2/src/general.ts'
import {
    Event,
    EventInternals,
} from 'https://deno.land/x/remapper@3.1.2/src/basicEvent.ts'
import {
    Difficulty,
    transferVisuals,
} from 'https://deno.land/x/remapper@3.1.2/src/beatmap.ts'
import { PRESET } from 'https://deno.land/x/remapper@3.1.2/src/constants.ts'
import {
    Environment,
    Geometry,
} from 'https://deno.land/x/remapper@3.1.2/src/environment.ts'
import {
    adjustFog,
    Vec3,
} from 'https://deno.land/x/remapper@3.1.2/src/general.ts'
import { ModelScene } from 'https://deno.land/x/remapper@3.1.2/src/model.ts'
import {
    Arc,
    Bomb,
    Chain,
    Note,
} from 'https://deno.land/x/remapper@3.1.2/src/note.ts'
import { Regex } from 'https://deno.land/x/remapper@3.1.2/src/regex.ts'
import { CustomEvent } from 'https://deno.land/x/remapper@3.1.2/src/custom_event.ts'

const map = new Difficulty('EasyLightshow')

// ----------- { SCRIPT } -----------

const fillLightIDs = (base: number, length: number) =>
    Array.from({ length: length }, (_, i) => base + i)

let nextID = 0
function newBaseID() {
    nextID += 1000
    return nextID
}

// Fog
adjustFog(
    (x) => {
        x.startY = -150
        x.height = 40
        // x.attenuation = 0.000001
        // x.attenuation = 0.00005
    },
)

const fogFadeOut: ComplexKeyframesLinear[0][] = []

for (let i = 0; i <= 1; i += 1 / 20) {
    const num = lerp(Math.pow(0.0001, 1 / 10), 1, i)
    fogFadeOut.push([Math.pow(num, 10), lerpEasing('easeOutExpo', i)])
}

const fogAnims: [ComplexKeyframesLinear | number, number, number?][] = [
    [[[0.0008, 0], [0.0001, 1, 'easeOutExpo']], 5.75, 40],
    [[[0.0001, 0], [0.00001, 1, 'easeOutExpo']], 135, 2],
    [[[0.00001, 0], [0.0001, 1, 'easeInOutCubic']], 261, 4],
    [[[0.0001, 0], [0.000001, 1, 'easeInOutCubic']], 327 - 3, 4],
    [
        [[0.000001, 0], [0.00001, 0.5, 'easeInExpo'], [
            0.000001,
            1,
            'easeOutExpo',
        ]],
        455 - 8,
        16,
    ],
    [[[0.000001, 0], [0.0001, 1, 'easeInOutCubic']], 711 - 4, 8],
    [
        fogFadeOut,
        765,
        782 - 765,
    ],
]

fogAnims.forEach((f) => {
    adjustFog(
        (x) => {
            x.attenuation = f[0]
        },
        f[1],
        f[2],
    )
})

// Removal
function remove(ids: string[], regex = false) {
    const env = new Environment(undefined, regex ? 'Regex' : undefined)
    env.active = false

    ids.forEach((x) => {
        env.id = x
        env.push()
    })
}

remove([
    'WaterRainRipples',
    'RectangleFakeGlow',
    'Mirror',
    'Clouds',
    'Waterfall',
    'Mountains',
])

{
    const env = new Environment('Rail')
    env.position = [0, -69420, 0]
    env.push()
}

// Scene
const scene = new ModelScene(
    new Geometry('Cube', {
        shader: 'Standard',
    }),
)

// Smoke
{
    const env = new Environment('BigSmokePS', 'EndsWith')
    env.active = false
    env.push()
    env.active = true

    const smokeSize = 0.04
    scene.addPrimaryGroups('smoke', env, [smokeSize, smokeSize, smokeSize])
}

// Sun
{
    const env = new Environment('Sun', 'EndsWith')
    env.track.value = 'sun'
    env.push()
    scene.assignObjects('sun')
}

// Flare
const FLARE_TRANSFORM = {
    ID: new Regex('Sun').separate().add('NeonTube').vary(2).end(),
    SCALE: [1 / 15, 1 / 10, 1 / 15] as Vec3,
}

const flareID = newBaseID()
{
    const env = new Environment(FLARE_TRANSFORM.ID, 'Regex')
    env.lightType = 1
    env.lightID = flareID
    env.components.TubeBloomPrePassLight = {
        colorAlphaMultiplier: 1,
        bloomFogIntensityMultiplier: 1,
    }

    scene.addPrimaryGroups('flare', env, FLARE_TRANSFORM.SCALE)
}

// Hexagons
const HEXAGON_TRANSFORM: Vec3[] = [
    [1.156, 1, 1].map((x) => x *= 1.5) as Vec3, // Scale
]

const hexagonID = newBaseID()
{
    const env = new Geometry('Triangle', {
        shader: 'TransparentLight',
    })
    env.components.TubeBloomPrePassLight = {
        colorAlphaMultiplier: 0.3,
    }
    env.lightType = 1
    env.lightID = hexagonID

    scene.addPrimaryGroups('hexagon', env, ...HEXAGON_TRANSFORM)
}

// Solid Lasers
const solidID = newBaseID()
const solidLightAmount = 8

{
    const env = new Environment(FLARE_TRANSFORM.ID, 'Regex')
    env.lightType = 1
    env.components.TubeBloomPrePassLight = {
        colorAlphaMultiplier: 4,
        bloomFogIntensityMultiplier: 1,
    }

    for (let i = 0; i < solidLightAmount; i++) {
        const solid = copy(env)
        solid.lightID = solidID + i
        const track = `solid${i + 1}`
        scene.addPrimaryGroups(track, solid, FLARE_TRANSFORM.SCALE)
    }
}

// Bloom Lights
const bloomID = newBaseID()
const bloomLightAmount = 8

{
    const env = new Environment(FLARE_TRANSFORM.ID, 'Regex')
    env.lightType = 1
    env.components.TubeBloomPrePassLight = {
        colorAlphaMultiplier: 1.5,
        bloomFogIntensityMultiplier: 1,
    }

    for (let i = 0; i < bloomLightAmount; i++) {
        const bloom = copy(env)
        bloom.lightID = bloomID + i
        const track = `bloom${i + 1}`
        scene.addPrimaryGroups(track, bloom, FLARE_TRANSFORM.SCALE)
    }
}

// Setup Bloom Lights
const baseLightID = (vary = 0) =>
    new Regex('LightRailingSegment').vary(vary).separate().add(
        'NeonTubeDirectionalL',
    ).string

const BLOOM_LIGHT = {
    ID: baseLightID() + '$',
    SCALE: <Vec3> [1, 0.2, 1],
}

{
    const env = new Environment(
        new Regex(baseLightID()).separate().add('BoxLight').end(),
        'Regex',
    )
    env.active = false
    env.push()
}

// Atmosphere
const atmoID = newBaseID()
const atmoAmount = 40

{
    const env = new Environment(BLOOM_LIGHT.ID, 'Regex')
    env.components.TubeBloomPrePassLight = {
        bloomFogIntensityMultiplier: 10,
    }
    env.duplicate = 1
    env.lightType = 1
    env.rotation = [0, 0, 90]
    env.scale = [1, 10000, 1]

    for (let i = 0; i < atmoAmount; i++) {
        const atmo = copy(env)
        atmo.lightID = atmoID + i
        atmo.position = [0, i * 10, 200]
        atmo.push()
    }
}

// Rotating Lasers
for (let s = -1; s <= 1; s += 2) {
    for (let l = 0; l <= 8; l++) {
        const side = s === -1 ? 'L' : 'R'
        const ID = new Regex().add('BottomPairLasers').vary(l).separate().add(
            `Pillar${side}`,
        ).end()

        const env = new Environment(ID, 'Regex')
        const track = `rotating_${side}_${l}`
        env.track.value = track
        env.components.TubeBloomPrePassLight = {
            colorAlphaMultiplier: 3,
            bloomFogIntensityMultiplier: 10,
        }
        env.push()
        scene.assignObjects(track)
    }
}

// Activate ModelScene
scene.static('env', undefined, (x) => {
    if (x.track.has('sun')) {
        x.animate.scale = [1, 1, 1]
    }
})

// Adjust flares based on sun
map.rawEnvironment.forEach((e) => {
    if (
        e.track.value &&
        e.track.check((t) =>
            t.includes('flare') || t.includes('bloom') || t.includes('solid')
        )
    ) {
        const event = new CustomEvent().animateTrack(e.track.value)
        event.animate.position = e.position
        event.push()
    }
})

/*
? SUN: SUN ALL
? FLARE: SUN 1
? BACKGROUND: LEFT SUNBEAMS
? LEFT ROTATING LASERS: -
? RIGHT ROTATING LASERS: -
? SOLID LIGHTS: RIGHT SUNBEAMS 1-8
? BLOOM LIGHTS: RIGHT SUNBEAMS 9-16
*/

// Flare lighting
const flareIDs = fillLightIDs(flareID, scene.objectInfo.flare.max)

new LightRemapper().type(4).IDs(1).setIDs(flareIDs).setType(1).run()

// Sun lighting
const hexagonIDs = fillLightIDs(hexagonID, scene.objectInfo.hexagon.max)

new LightRemapper().type(4).initIDs([1, 4]).addProcess((x) => {
    const newEvent = copy(x)
    newEvent.type = 1
    ;(newEvent.lightID as number[]).push(...hexagonIDs)
    newEvent.push()
}).multiplyColor(1).run()

// Solid/Bloom lighting
const solidIDs = fillLightIDs(solidID, solidLightAmount)
const bloomIDs = fillLightIDs(bloomID, bloomLightAmount)

new LightRemapper().type(3).initIDs([...solidIDs, ...bloomIDs]).addProcess(
    (x) => {
        const ids = typeof x.lightID === 'number' ? [x.lightID] : x.lightID
        x.lightID = ids.map((id) =>
            id +=
                (id > solidLightAmount ? bloomID - solidLightAmount : solidID) -
                1
        )
    },
).setType(1).run()

// Atmosphere lighting
type LightEvent = EventInternals.AbstractEvent
const atmosphereFilter = (e: LightEvent) => e.type === 2
const atmosphereEvents = map.events.filter((x) => atmosphereFilter(x))
map.events = map.events.filter((x) => !atmosphereFilter(x))

const atmosphereLayers: Record<number, LightEvent[]> = {}
atmosphereEvents.forEach((x) => {
    const layerTime = round(x.time, 0.001)

    if (!atmosphereLayers[layerTime]) {
        atmosphereLayers[layerTime] = [x]
    } else {
        atmosphereLayers[layerTime].push(x)
    }
})

Object.values(atmosphereLayers).forEach((arr) => {
    let colors: ComplexKeyframesVec3 = []

    for (let i = 0; i < arr.length; i++) {
        colors.push(arr[i].color as Vec4)
    }

    colors = colors.sort((a, b) => a[3] - b[3])

    for (let i = 0; i < atmoAmount; i++) {
        const col = getValuesAtTime('position', colors, i / atmoAmount) as Vec3
        new Event(arr[0].time).setType(1).on(
            [...col, 1],
            atmoID + i,
        ).push()
    }
})

// ----------- { OUTPUT } -----------

const allNotes: (Note | Bomb | Arc | Chain)[] = []
allNotes.push(...map.notes)
allNotes.push(...map.bombs)
allNotes.push(...map.arcs)
allNotes.push(...map.chains)
allNotes.push(...map.fakeNotes)
allNotes.push(...map.fakeBombs)
allNotes.push(...map.fakeChains)

allNotes.forEach((x) => {
    x.customData.spawnEffect = false
})

transferVisuals([
    'EasyStandard',
    'NormalStandard',
    'HardStandard',
    'ExpertStandard',
    'ExpertPlusStandard',
], (d) => {
    d.rawSettings = PRESET.CHROMA_SETTINGS
    d.settings.mirrorQuality = 'OFF'
    d.settings.smoke = true
    d.settings.smoke = true
    d.settings.noHud = true
    d.require('Noodle Extensions', false)
    d.require('Chroma', false)
    d.suggest('Chroma')

    // Aliased properties awre broken lol I'll have to fix it in rm4
    d.diffSetMap._customData._colorLeft = map.colorLeft
    d.diffSetMap._customData._colorRight = map.colorRight
})

exportZip(['EasyLightshow'])
