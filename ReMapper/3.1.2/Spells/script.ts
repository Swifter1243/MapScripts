import * as rm from 'https://deno.land/x/remapper@3.1.2/src/mod.ts'

const map = new rm.Difficulty('ExpertPlusNoArrows')

// ----------- { SCRIPT } -----------

/*
? WATER 1: Cube
? WATER 4: Rain
? SUN: Swirls
? BACKGROUND: LEFT SUNBEAMS
? LEFT ROTATING LASERS: -
? RIGHT ROTATING LASERS: -
? SOLID LIGHTS: RIGHT SUNBEAMS 1-8
? BLOOM LIGHTS: RIGHT SUNBEAMS 9-16
*/

type LightEvent = rm.EventInternals.AbstractEvent

const outputType = 7

const fillLightIDs = (base: number, length: number) =>
    Array.from({ length: length }, (_, i) => base + i)

let nextID = 0
function newBaseID() {
    nextID += 1000
    return nextID
}

map.geoMaterials.solid = {
    shader: 'Standard',
}

map.geoMaterials.light = {
    shader: 'TransparentLight',
}

map.geoMaterials.solidLight = {
    shader: 'OpaqueLight',
}

// Fog
rm.adjustFog((x) => {
    x.attenuation = 0.000006
    x.startY = 1500
    x.height = -600
})

const fogAnims: [rm.ComplexKeyframesLinear | number, number, number?][] = [
    [0.000001, 207],
    [0.0001, 413],
    [0.0000005, 415],
    [[[0.0000005, 0], [0.00005, 1, 'easeInOutCubic']], 463, 8],
    [0.0001, 527],
]

fogAnims.forEach((f) => {
    rm.adjustFog(
        (x) => {
            x.attenuation = f[0]
        },
        f[1],
        f[2],
    )
})

// Removal
function remove(ids: string[], regex = false) {
    const env = new rm.Environment(undefined, regex ? 'Regex' : undefined)
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
    'Waterfall',
    'Mountains',
    'DirectionalLight',
    'Clouds',
])

{
    const env = new rm.Environment('Rail')
    env.position = [0, -69420, 0]
    env.push()
}

const rainID = newBaseID()

{
    const env = new rm.Environment('Rain')
    env.lightID = rainID
    env.lightType = outputType
    env.push()
}

new rm.LightRemapper().type(0).setType(outputType).setIDs(rainID).run()

// Scene
const scene = new rm.ModelScene(
    new rm.Geometry('Cube', 'solid'),
)

// Solid Lasers
const solidID = newBaseID()
const solidLightAmount = 8

{
    const env = new rm.Geometry('Quad', 'light')
    env.lightType = 1
    env.components.TubeBloomPrePassLight = {
        colorAlphaMultiplier: 4,
        bloomFogIntensityMultiplier: 20,
    }

    for (let i = 0; i < solidLightAmount; i++) {
        const solid = rm.copy(env)
        solid.lightID = solidID + i
        const track = `solid${i + 1}`
        scene.addPrimaryGroups(track, solid)
    }
}

// Bloom Lights
const bloomID = newBaseID()
const bloomLightAmount = 8

{
    const env = new rm.Geometry('Cube', 'light')
    env.lightType = 1
    env.components.TubeBloomPrePassLight = {
        colorAlphaMultiplier: 5,
        bloomFogIntensityMultiplier: 10,
    }

    for (let i = 0; i < bloomLightAmount; i++) {
        const bloom = rm.copy(env)
        bloom.lightID = bloomID + i
        const track = `bloom${i + 1}`
        scene.addPrimaryGroups(track, bloom, [0, 1, 0])
    }
}

// Rotating Lasers
for (let s = -1; s <= 1; s += 2) {
    for (let l = 0; l <= 8; l++) {
        const side = s === -1 ? 'L' : 'R'
        const ID = new rm.Regex('BottomPairLasers').vary(l).separate().add(
            `Pillar${side}`,
        ).end()

        const env = new rm.Environment(ID, 'Regex')
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

// Swirls
const swirlsID = newBaseID()

{
    const env = new rm.Geometry('Sphere', 'light')
    env.lightType = outputType
    env.lightID = swirlsID

    scene.addPrimaryGroups('sphere', env)
}

// Smoke
{
    const env = new rm.Environment('BigSmokePS', 'EndsWith')
    env.active = false
    env.push()
    env.active = true

    const smokeSize = 0.04
    scene.addPrimaryGroups('smoke', env, [smokeSize, smokeSize, smokeSize])
}

// Cube
const cubeID = newBaseID()

{
    const env = new rm.Geometry('Cube', 'solidLight')
    env.lightID = cubeID
    env.lightType = outputType

    scene.addPrimaryGroups('cube', env)
}

// Activate ModelScene
scene.static('env', (x) => {
    if (x.track.check((x) => x.includes('cube'))) {
        const env = new rm.Environment('Sun', 'EndsWith')
        env.position = rm.arrMul(x.position, 0.5)
        env.rotation = [0, 0, 90]
        env.scale = rm.arrMul([1, 0.5, 1], 10)
        env.push()
    }

    if (x.track.check((x) => x.includes('sphere'))) {
        const bopPosition = rm.arrAdd(x.position, [0, 20, 0])
        const timeOffset = (x.position[1] - 100) * 0.01

        const event = new rm.CustomEvent(timeOffset).animateTrack(
            x.track.value,
            10,
        )
        event.animate.position = [
            [...x.position, 0],
            [...bopPosition, 0.5, 'easeInOutSine'],
            [...x.position, 1, 'easeInOutSine'],
        ]
        event.repeat = 69420
        event.push()
    }
})

// Swirl Lighting
const swirlsIDs = fillLightIDs(swirlsID, scene.objectInfo.sphere.max)
new rm.LightRemapper().type(4).setType(outputType).setIDs(swirlsIDs)
    .multiplyColor(3, 5).run()

// Cube Lighting
new rm.LightRemapper().type(1).setType(outputType).setIDs(cubeID).addProcess(
    (x) => {
        const eventCopy = rm.copy(x)
        eventCopy.lightID = 4
        eventCopy.type = rm.EVENTGROUP.CENTER_LASERS

        const rgb = 0.5

        if (x.color) {
            eventCopy.color[0] *= rgb
            eventCopy.color[1] *= rgb
            eventCopy.color[2] *= rgb
        }

        eventCopy.push()
    },
).multiplyColor(6, 6).run()

// Atmosphere
const atmoID = newBaseID()
const atmoAmount = 40
const atmoType = 2

{
    const env = new rm.Geometry('Cube', 'light')
    env.components.TubeBloomPrePassLight = {
        bloomFogIntensityMultiplier: 2,
    }
    env.duplicate = 1
    env.lightType = outputType
    env.rotation = [0, 0, 90]
    env.scale = [0, 10000, 0]

    for (let i = 0; i < atmoAmount; i++) {
        const atmo = rm.copy(env)
        atmo.lightID = atmoID + i
        atmo.position = [0, i * 10 - 60, 200]
        atmo.push()
    }
}

// Atmosphere Lighting
const atmosphereFilter = (e: LightEvent) => e.type === atmoType
const atmosphereEvents = map.events.filter((x) => atmosphereFilter(x))
map.events = map.events.filter((x) => !atmosphereFilter(x))

const atmosphereLayers: Record<number, LightEvent[]> = {}
atmosphereEvents.forEach((x) => {
    const layerTime = rm.round(x.time, 0.001)

    if (!atmosphereLayers[layerTime]) {
        atmosphereLayers[layerTime] = [x]
    } else {
        atmosphereLayers[layerTime].push(x)
    }
})

Object.values(atmosphereLayers).forEach((arr) => {
    let colors: rm.ComplexKeyframesVec3 = []

    for (let i = 0; i < arr.length; i++) {
        colors.push(arr[i].color as rm.Vec4)
    }

    colors = colors.sort((a, b) => a[3] - b[3])

    for (let i = 0; i < atmoAmount; i++) {
        const col = rm.getValuesAtTime(
            'position',
            colors,
            i / atmoAmount,
        ) as rm.Vec3
        new rm.Event(arr[0].time).setType(outputType).on(
            [...col, 1],
            atmoID + i,
        ).push()
    }
})

// Solid/Bloom lighting
const solidIDs = fillLightIDs(solidID, solidLightAmount)
const bloomIDs = fillLightIDs(bloomID, bloomLightAmount)

new rm.LightRemapper().type(3).initIDs([...solidIDs, ...bloomIDs]).addProcess(
    (x) => {
        const ids = typeof x.lightID === 'number' ? [x.lightID] : x.lightID
        x.lightID = ids.map((id) =>
            id +=
                (id > solidLightAmount ? bloomID - solidLightAmount : solidID) -
                1
        )
    },
).setType(1).run()

// ----------- { OUTPUT } -----------

rm.info.environment = 'BillieEnvironment'
rm.info.save()

rm.transferVisuals([
    'EasyStandard',
    'NormalStandard',
    'HardStandard',
    'ExpertStandard',
    'ExpertPlusStandard',
], (d) => {
    d.rawSettings = rm.PRESET.CHROMA_SETTINGS
    d.settings.mirrorQuality = 'OFF'
    d.settings.smoke = true
    d.settings.noHud = true
    d.require('Noodle Extensions', false)
    d.require('Chroma', false)
    d.suggest('Chroma')

    const allNotes: (rm.Note | rm.Bomb | rm.Arc | rm.Chain)[] = []
    allNotes.push(...d.notes)
    allNotes.push(...d.bombs)
    allNotes.push(...d.arcs)
    allNotes.push(...d.chains)
    allNotes.push(...d.fakeNotes)
    allNotes.push(...d.fakeBombs)
    allNotes.push(...d.fakeChains)

    allNotes.forEach((x) => {
        x.customData.spawnEffect = false
    })

    // Aliased properties are broken lol I'll have to fix it in rm4
    d.diffSetMap._customData._colorLeft = map.colorLeft
    d.diffSetMap._customData._colorRight = map.colorRight
    d.diffSetMap._customData._obstacleColor = map.wallColor
})

rm.exportZip(['ExpertPlusNoArrows'])
