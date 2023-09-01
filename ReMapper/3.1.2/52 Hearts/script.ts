import * as rm from 'https://deno.land/x/remapper@3.1.2/src/mod.ts'

const map = new rm.Difficulty('ExpertPlusNoArrows')

// ----------- { SCRIPT } -----------

/*
? LEFT LASERS: LEFT LASERS
? RIGHT LASERS: RIGHT LASERS
? BIG RINGS: ATMOSPHERE
? CENTER LIGHTS 1: HORIZON
? CENTER LIGHTS 2-6: HANGING AURORAS
? BACK LASERS: AURORAS
*/

type LightEvent = rm.EventInternals.AbstractEvent

const outputType = 10

const fillLightIDs = (base: number, length: number) =>
    Array.from({ length: length }, (_, i) => base + i)

let nextID = 0
function newBaseID() {
    nextID += 1000
    return nextID
}

map.geoMaterials.light = {
    shader: 'TransparentLight',
}

// Fog
rm.adjustFog((x) => {
    x.attenuation = 0.00001
    x.height = -300
    x.startY = 1000
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
    'Tube',
    'RunwayPillar',
    'TeslaTower',
    'RectangleFakeGlow',
    'Logo',
    'BackCube',
    'Smoke',
    'FrontLasers',
])

remove([
    new rm.Regex('Environment').separate().add('Construction').end(),
], true)

{
    const env = new rm.Environment('Aurora')
    env.position = [0, -69420, 0]
    env.push()
}

{
    const env = new rm.Environment('Runway', 'EndsWith')
    env.scale = [10000, 1, 6]
    env.push()
}

for (let i = 0; i < 10; i++) {
    const env = new rm.Environment('StarSky', 'EndsWith')
    env.duplicate = 1
    env.rotation = [
        rm.rand(-20, 20),
        rm.rand(-180, 180),
        0,
    ]
    env.push()
}

// Scene
const scene = new rm.ModelScene(new rm.Geometry())

const model = rm.copy(rm.getModel('env'))

// Hanging Auroras
let hangingAmount = 1
const hangingID = newBaseID()

for (
    let group = 1;
    model.some((x) => x.track === `hanging${group}`);
    group++
) {
    hangingAmount = group

    const env = new rm.Environment(rm.ENV.GAGA.SECOND_AURORA.ID, 'Regex')
    env.duplicate = 1
    env.lightID = group + hangingID - 1
    env.lightType = outputType

    scene.addPrimaryGroups(
        `hanging${group}`,
        env,
        ...rm.ENV.GAGA.SECOND_AURORA.TRANSFORM,
    )
}

// Activate ModelScene
scene.static(model)

// Hanging Aurora Lighting
const hangingIDs = fillLightIDs(hangingID, hangingAmount)

new rm.LightRemapper((x) => {
    if (x.lightID === undefined) return true

    const id = typeof x.lightID === 'object' ? x.lightID : [x.lightID]
    return id.some((a) => a >= 2 && a <= hangingAmount + 1)
}).type(
    rm.EVENTGROUP.CENTER_LASERS,
).addToEnd(
    hangingID - 2,
).initIDs(hangingIDs).setType(outputType).multiplyColor(5).run()

// Auroras
type AuroraID = {
    id: number[]
    hue: number[]
    falloff: number[]
}

const auroraLoops = 50
const auroraBopDur = 20
let auroraID = newBaseID()
const auroraIDs: Record<number, AuroraID> = {}

for (
    let group = 1;
    model.some((x) => x.track === `aurora_${group}_1`);
    group++
) {
    const objs: rm.ModelObject[] = model.filter((x) =>
        x.track?.includes(`aurora_${group}`)
    )

    // [[0,0,0,0]]
    const points: rm.ComplexKeyframesVec3 = []

    objs.forEach((x) => {
        const t = (parseInt((x.track as string).split('_')[2]) - 1) /
            ((objs.length - 1) ?? 1)

        points.push([...(x.pos as rm.Vec3), t, 'splineCatmullRom'])
    })

    const IDs: AuroraID = {
        id: [],
        hue: [],
        falloff: [],
    }

    auroraIDs[group] = IDs

    for (let i = 0; i <= auroraLoops; i++) {
        const t = 1 - (i / auroraLoops)
        const edgeFade = Math.pow((0.5 - Math.abs(t - 0.5)) * 2, 0.3)
        const width = rm.rand(3, 20) * edgeFade * 2.5

        const rawPos = rm.getValuesAtTime('position', points, t) as rm.Vec3
        const towardOrigin = rm.toDegrees([Math.atan2(rawPos[0], rawPos[2])])[0]
        const flip = Math.random() > 0.5 ? 180 : 0

        const rot = [
            0,
            rm.rand(-1, 1) * 20 + towardOrigin,
            90 + flip,
        ] as rm.Vec3
        const scale = [5 * width, width * 0.3, 0] as rm.Vec3
        const pos = rm.arrAdd(
            rm.arrAdd(
                rm.applyAnchor(
                    rawPos,
                    rot,
                    scale,
                    rm.ENV.GAGA.SECOND_AURORA.TRANSFORM[1],
                ),
                [rm.rand(1, 10), 1, 1] as rm.Vec3,
            ),
            [0, width * 2, 0],
        )

        const falloff = Math.pow(rm.clamp(1 - (pos[2] / 1900), 0, 1), 1 / 3)

        if (falloff <= 0.01) {
            continue
        }

        const track = `aurora_${group}_${i}`

        IDs.falloff.push(falloff)
        IDs.id.push(auroraID)
        IDs.hue.push(0.6 + rm.rand(-0.1, 0.05) + t * 0.23)

        const env = new rm.Environment(rm.ENV.GAGA.SECOND_AURORA.ID, 'Regex')
        env.position = pos
        env.rotation = rot
        env.lightType = outputType
        env.lightID = auroraID++
        env.scale = rm.arrMul(scale, rm.ENV.GAGA.SECOND_AURORA.TRANSFORM[0])
        env.duplicate = 1
        env.track.value = track
        env.push()

        const event = new rm.CustomEvent(
            t * auroraBopDur / 2 + (group - 1) * 5 - 30,
        ).animateTrack(
            track,
            auroraBopDur,
        )
        event.animate.position = [
            [...pos, 0],
            [...rm.arrAdd(pos, [0, 20, 0]), 0.5, 'easeInOutSine'],
            [...pos, 1, 'easeInOutSine'],
        ]
        event.repeat = 69420
        event.push()
    }
}

// Atmosphere
const atmoID = newBaseID()
const atmoAmount = 40

{
    const env = new rm.Geometry('Cube', 'light')
    env.components.TubeBloomPrePassLight = {
        bloomFogIntensityMultiplier: 1,
    }
    env.duplicate = 1
    env.lightType = outputType
    env.rotation = [0, 0, 90]
    env.scale = [0, 10000, 0]

    for (let i = 0; i < atmoAmount; i++) {
        const atmo = rm.copy(env)
        atmo.lightID = atmoID + i
        atmo.position = [0, i * 10, 200]
        atmo.push()
    }
}

// Atmosphere Lighting
const atmosphereType = rm.EVENTGROUP.RING_LIGHTS

const atmosphereFilter = (e: LightEvent) => e.type === atmosphereType
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

// Rotating Lasers
const rotatingID = newBaseID()
const leftIDs = [] as number[]
const rightIDs = [] as number[]
const lasersForward = 100
const lasersSideways = 20
const lasersTravel = 20
const laserAmount = 7
const laserTilt = 10
const laserTravelDur = 200

for (let s = -1; s <= 1; s += 2) {
    for (let l = 1; l <= laserAmount; l++) {
        const id = Math.max(0, s) * laserAmount + l + rotatingID
        const track = `rotating${id}`
        ;(s === -1 ? leftIDs : rightIDs).push(id)

        const env = new rm.Geometry('Cube', 'light')
        env.lightType = outputType
        env.lightID = id
        env.track.value = track
        env.scale = [0.1, 10000, 0.1]
        env.push()

        const startPos = [lasersSideways * s, -100, lasersForward] as rm.Vec3
        const endPos = rm.arrAdd(startPos, [lasersTravel * s, 0, 0])
        const tilt = laserTilt * s

        const event = new rm.CustomEvent(
            l * laserTravelDur / laserAmount - laserTravelDur,
        ).animateTrack(
            track,
            laserTravelDur,
        )
        event.animate.position = [
            [...startPos, 0],
            [...endPos, 0.5, 'easeInOutSine'],
            [...startPos, 1, 'easeInOutSine'],
        ]
        event.animate.rotation = [
            [0, 0, tilt, 0],
            [0, 180 * s, tilt, 0.5],
            [0, 360 * s, tilt, 1],
        ]
        event.repeat = 69420
        event.push()
    }
}

// Rotating Lasers Lighting
new rm.LightRemapper().type(rm.EVENTGROUP.LEFT_LASERS).addToEnd(rotatingID)
    .initIDs(leftIDs).setType(outputType).run()

new rm.LightRemapper().addProcess((x) => {
    if (
        // this is a thing for some reason???????????????????
        x.lightID !== undefined &&
            (x.lightID as number[])[0] === 8 || x.lightID === 7
    ) {
        x.lightID = 7
    }
}).type(rm.EVENTGROUP.RIGHT_LASERS).addToEnd(
    rotatingID + laserAmount,
).initIDs(rightIDs).setType(outputType).run()

// Horizon
const horizonID = newBaseID()

{
    const env = new rm.Geometry('Cube', 'light')
    env.scale = [0, 10000, 0]
    env.rotation = [0, 0, 90]
    env.position = [0, 0, 50]
    env.lightType = outputType
    env.lightID = horizonID
    env.push()
}

new rm.LightRemapper().type(rm.EVENTGROUP.CENTER_LASERS).IDs(1).setType(
    outputType,
).setIDs(horizonID).run()

// Aurora Lighting
const auroraFullIDs = Object.keys(auroraIDs).map((x) => parseInt(x))

const auroraFilter = (e: LightEvent) => e.type === rm.EVENTGROUP.BACK_LASERS
const auroraEvents = map.events.filter((x) => auroraFilter(x))
map.events = map.events.filter((x) => !auroraFilter(x))

new rm.LightRemapper().type(rm.EVENTGROUP.BACK_LASERS).initIDs(auroraFullIDs)
    .addProcess((event) => {
        const lightID = typeof event.lightID === 'object'
            ? event.lightID
            : [event.lightID]
        const eventCol = new rm.Color(event.color ?? [0, 0, 0], 'RGB')
        eventCol.toFormat('HSV')

        lightID.forEach((group) => {
            const currentID = auroraIDs[group]
            currentID.id.forEach((x, i) => {
                const newEvent = rm.copy(event)
                newEvent.type = outputType

                if (event.color) {
                    const col = new rm.Color(
                        [
                            (eventCol.value[0] + currentID.hue[i] - 0.65) % 1,
                            eventCol.value[1],
                            eventCol.value[2],
                            1,
                        ],
                        'HSV',
                    ).export().map((x) => x * 2) as rm.ColorType

                    col[3] = currentID.falloff[i]

                    newEvent.color = col
                }

                newEvent.lightID = x
                newEvent.push()
            })
        })
    }).processEvents(auroraEvents)

// ----------- { OUTPUT } -----------

rm.info.environment = 'GagaEnvironment'
rm.info.save()

rm.transferVisuals([
    'ExpertPlusStandard',
], (d) => {
    d.rawSettings = rm.PRESET.CHROMA_SETTINGS
    d.settings.mirrorQuality = 'HIGH'
    d.settings.smoke = false
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
