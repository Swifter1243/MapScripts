const fs = require("fs");
const three = require("three");
let map = JSON.parse(fs.readFileSync("ExpertPlusStandard.dat"));
let expert = JSON.parse(fs.readFileSync("ExpertStandard.dat"));

/* IDEAS LIST:
- Make the really fast flickers of the X in the first drop a lot brighter
- 

TODO: REMEMBER TO DELETE THE NOODLE REQUIREMENT!!!!!!!!!!!!!!!!
TODO: REMOVE TEST DIFF!
TODO: RECORD LIGHTSHOW AS WELL AS GAMEPLAY
TODO: REMEMBER TO APPLY BOMB COLOR AND REMOVE NOTE SPAWN EFFECT ON LOWER DIFF
*/

const pillarToNoodleUnits = 0.1495; // Divide by 32 on the Y axis

map._customData._environment = [
    {
        _id: "Mirror",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "Construction",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "Frame",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "RectangleFakeGlow",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "SaberBurnMarks",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "BottomGlow",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "Clouds",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "TrackMirror",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "PillarTrackLaneRing",
        _lookupMethod: "Regex",
        _active: false
    },
    {
        _id: "PillarPair(\\s\\(\\d\\))?$",
        _lookupMethod: "Regex",
        _position: [0, -69420, 0]
    },
    {
        _id: "MagicDoorSprite$",
        _lookupMethod: "Regex",
        _position: [0, -69420, 0]
    },
    // {
    //     _id: "MagicDoorSprite\\.\\[\\d\\]Bloom",
    //     _lookupMethod: "Regex",
    //     _position: [0, -40, 30],
    //     _rotation: [-90, 0, 0],
    //     _scale: [100, 100, 100]
    // }
    {
        _id: "Environment\\.\\[\\d*\\]GlowLine",
        _lookupMethod: "Regex",
        _position: [0, -69420, 0]
    }
]

for (let l = 0; l <= 8; l++) {
    for (let s = -1; s <= 1; s += 2) {
        let suffix = l > 1 ? ` \\(${Math.floor(l / 2)}\\)` : "";
        let pillarPair = `\\]${l % 2 == 0 ? "PillarPair" : "SmallPillarPair"}${suffix}`
        let pillarSide = s == -1 ? "L" : "R";
        let id = `${pillarPair}\\.\\[\\d\\]Pillar${pillarSide}\\.\\[\\d\\]RotationBase${pillarSide}`

        let lightPos = [l * 2 * s + (-0 * s), -5 - (l * 2), l * 10 + 40]
        let lightRot = [20, 0, 15 * s * l + (-20 * s)]

        map._customData._environment.push(
            {
                _id: `${pillarPair}\\.\\[\\d\\]Pillar${pillarSide}$`,
                _lookupMethod: "Regex",
                _position: lightPos,
                _rotation: lightRot
            },
            {
                _id: `${id}\\.\\[\\d\\](Reflector$|LaserLight)|${pillarPair}\\.\\[\\d\\]Pillar${pillarSide}\\.\\[\\d\\]Pillar$`,
                _lookupMethod: "Regex",
                _active: false
            }
        );
    }
}

function vectorFromRotation(vectorRot, length) {
    const deg2rad = Math.PI / 180;
    var mathRot = copy(vectorRot);

    mathRot[0] *= deg2rad;
    mathRot[1] *= deg2rad;
    mathRot[2] *= deg2rad;

    var rotVector = new three.Vector3(0, length, 0).applyEuler(new three.Euler(...mathRot, "YXZ"));
    return [rotVector.x, rotVector.y, rotVector.z];
}

function copy(obj) {
    if (typeof obj != 'object') return obj;

    var newObj = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        newObj[key] = copy(obj[key]);
    }
    return newObj
}

function isInID(lightID, start, end) {
    if (typeof lightID === "object") {
        lightID.forEach(x => {
            if (x >= start && x <= end) return true;
        })
    }
    else if (lightID >= start && lightID <= end) return true;
    return false;
}

function eventToNewID(x, oldID, newID, newType) {
    x._type = newType;

    let lightID = x._customData._lightID;

    if (typeof lightID !== "object") lightID = [lightID];
    if (typeof newID !== "object") newID = [newID];

    // lightID = lightIDs from the event
    // oldID = old starting point of IDs
    // newID = range of IDs to spread to

    // Shift every lightID to match first number of newID
    // If newID is a range, also spread last lightID out to match it

    let difference = newID[0] - oldID;

    let newLightID = [];
    lightID.forEach(y => { newLightID.push(y + difference) });
    lightID = copy(newLightID);

    if (newID.length > 1) {
        newLightID = copy(lightID);
        let range = newID[1] - newID[0];
        for (let i = lightID[lightID.length - 1] + 1; i <= lightID[lightID.length - 1] + range; i++) {
            newLightID.push(i);
        }
        lightID = copy(newLightID);
    }

    x._customData._lightID = lightID;
}

let laserNotes = [];

map._notes.forEach(x => {
    if (!x._customData) x._customData = {};
    x._customData._disableSpawnEffect = true;
    if (x._type == 3) x._customData._color = [0.59, 0.496, 0.35, 1];
    if (x._customData._track == "nest") {
        var y = copy(x);

        var pillarPos = y._customData._animation._definitePosition[0];
        var pillarRot = y._customData._animation._localRotation[0];
        var pillarScale = y._customData._animation._scale[0];

        pillarPos.pop();
        pillarRot.pop();
        pillarScale.pop();

        var offset = vectorFromRotation(pillarRot, pillarScale[1] / 2 * 0.87);

        pillarScale[0] *= pillarToNoodleUnits;
        pillarScale[1] *= pillarToNoodleUnits / 32;
        pillarScale[2] *= pillarToNoodleUnits;

        pillarPos[1] += 0.09;
        pillarPos[2] += 0.65 * (1 / 0.6);

        pillarPos[0] += offset[0];
        pillarPos[1] += offset[1];
        pillarPos[2] += offset[2];

        map._customData._environment.push({
            _id: "\\]PillarPair \\(1\\)\\.\\[0\\]PillarL\\.\\[0\\]Pillar$",
            _lookupMethod: "Regex",
            _duplicate: 1,
            _position: pillarPos,
            _scale: pillarScale,
            _rotation: pillarRot,
            _track: "nest",
            _active: true
        })
    }
    if (x._customData._track == "lasers") laserNotes.push(x);
});

laserNotes.sort((a, b) => a._customData._animation._definitePosition[0][2] - b._customData._animation._definitePosition[0][2]);
laserNotes.forEach(note => {
    let notePos = note._customData._animation._definitePosition[0];
    let noteRot = note._customData._animation._localRotation[0];
    let noteScale = note._customData._animation._scale[0];

    if (notePos[2] < 400) {
        map._customData._environment.push(
            { // ID 60-67
                _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
                _lookupMethod: "Regex",
                _duplicate: 1,
                _position: [notePos[0], notePos[1], notePos[2]],
                _rotation: [noteRot[0], noteRot[1], noteRot[2]],
                _lightID: 60
            },
            { // ID 70-77
                _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
                _lookupMethod: "Regex",
                _duplicate: 1,
                _position: [notePos[0], notePos[1], notePos[2]],
                _rotation: [0, 0, 0],
                _lightID: 70
            }
        )
    }
    else {
        map._customData._environment.push({ // ID 80-85
            _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
            _lookupMethod: "Regex",
            _duplicate: 1,
            _position: [notePos[0], notePos[1], notePos[2]], // - 170 Y and - 935 Z to look closely
            _rotation: [noteRot[0], noteRot[1], noteRot[2]],
            _scale: [noteScale[0] * 3.2, noteScale[1] * 0.0001, noteScale[2] * 3.2],
            _lightID: 80
        })
    }
})

var distance = 1400;
var lean = 20;

for (r = -90; r <= 90; r += 45) {
    var backlightVector = vectorFromRotation([90, r, 0], distance);

    map._customData._environment.push(
        { // ID 50 - 64
            _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]RotationBaseL$",
            _lookupMethod: "Regex",
            _duplicate: 1,
            _position: [backlightVector[0], -100, backlightVector[2]],
            _scale: [100000, 0.05, 1],
            _rotation: [90 - lean, r, 0],
            _track: "backLight",
            _lightID: 50
        }
    )
}

map._notes = map._notes.filter(x => !x._customData || (x._customData && !x._customData._track));

/*
LIGHT TYPES:
- [DONE] BACK LASERS = Used to light the entire bottom of the environment
- [DONE] CENTER LIGHT 1 = Circle light in the center
- [DONE] CENTER LIGHT 2 = Lasers on either side of player pointing forward
- [DONE] CENTER LIGHT 3 = Lasers on either side to the middle
- [DONE] INNER LIGHT 1-8 = Lasers going upwards spread randomly and rotated slightly randomly
- [DONE] ALT INNER LIGHT 1-8 = Lasers going upwards spread randomly not rotated
- [DONE] INNER LIGHT 9-10 = Lasers crossing like "+" and "x" in the middle
- [DONE] INNER LIGHT 11-12 = 2 pairs of lasers above the player coming from horizon
- [DONE] LEFT/RIGHT LASERS 1-9 = Moving lasers, idk do something cool with them with a for loop
- [DONE] LEFT LASERS = Backlight
- [DONE] RIGHT LASERS = Front left and right bloom
- [DONE] INNER RING = Spider eyes
*/

const crossScale = 20;
const angledCrossScale = 2;
const crossYScale = 0.0106;

map._customData._environment.push(
    { // Center Light 2: (1) ID 50
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [-5, 0, -20],
        _rotation: [90 + 5, 5, 0],
        _lightID: 50
    },
    { // Center Light 2: (1) ID 51
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [5, 0, -20],
        _rotation: [90 + 5, -5, 0],
        _lightID: 50
    },
    { // Center Light 1: (1) ID 52
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [0, 1.5, 40],
        _scale: [0.001, 0.00001, 0.001],
        _lightID: 50
    },
    { // Center Light 3: (1) ID 53
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [0, -10, 60],
        _rotation: [-50, 0, -50],
        _lightID: 50
    },
    { // Center Light 3: (1) ID 54
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [0, -10, 60],
        _rotation: [-50, 0, 50],
        _lightID: 50
    },
    { // Inner Light 9: (4) ID 50
        _id: "Environment\\.\\[\\d*\\]GlowLineH$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [0 - (3.5 * angledCrossScale), 1.5 + (3.5 * angledCrossScale), 40],
        _rotation: [0, 0, 45],
        _scale: [1, crossYScale * angledCrossScale, 1],
        _lightID: 50
    },
    { // Inner Light 9: (4) ID 51
        _id: "Environment\\.\\[\\d*\\]GlowLineH$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [0 + (3.5 * angledCrossScale), 1.5 + (3.5 * angledCrossScale), 40],
        _rotation: [0, 0, -45],
        _scale: [1, crossYScale * angledCrossScale, 1],
        _lightID: 50
    },
    { // Inner Light 10: (4) ID 52
        _id: "Environment\\.\\[\\d*\\]GlowLineH$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [-3.5 * crossScale, 1.5, 30],
        _rotation: [0, 0, 90],
        _scale: [1, crossYScale * crossScale, 1],
        _lightID: 50
    },
    { // Inner Light 10: (4) ID 53
        _id: "Environment\\.\\[\\d*\\]GlowLineH$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [0, 1.5 + (3.5 * crossScale), 30],
        _rotation: [0, 0, 0],
        _scale: [1, crossYScale * crossScale, 1],
        _lightID: 50
    },
    { // Inner Light 11: (1) ID 55
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [7, -10, 200],
        _rotation: [90 + 25, 0, 6],
        _scale: [5, -5, 5],
        _lightID: 50
    },
    { // Inner Light 11: (1) ID 56
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [-7, -10, 200],
        _rotation: [90 + 25, 0, -6],
        _scale: [5, -5, 5],
        _lightID: 50
    },
    { // Inner Light 12: (1) ID 57
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [11, -10, 200],
        _rotation: [90 + 25, 0, 12],
        _scale: [5, -5, 5],
        _lightID: 50
    },
    { // Inner Light 12: (1) ID 58
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [-11, -10, 200],
        _rotation: [90 + 25, 0, -12],
        _scale: [5, -5, 5],
        _lightID: 50
    },
    { // Back Lights: (1) ID 59
        _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: [0, -40, -30],
        _rotation: [90, 0, 0],
        _scale: [100, 100, 100],
        _lightID: 50
    }
)

map._events.forEach(x => {
    // Center Light 2
    if (x._customData && x._type == 4 && isInID(x._customData._lightID, 2, 2)) {
        eventToNewID(x, 2, [50, 51], 1);
    }
    // Center Light 1
    if (x._customData && x._type == 4 && isInID(x._customData._lightID, 1, 1)) {
        eventToNewID(x, 1, 52, 1);
    }
    // Center Light 3
    if (x._customData && x._type == 4 && isInID(x._customData._lightID, 3, 3)) {
        eventToNewID(x, 3, [53, 54], 1);
    }
    // Inner Light 9
    if (x._customData && x._type == 1 && isInID(x._customData._lightID, 17, 17)) {
        if (x._time >= 0 && x._time < 263 && x._customData._color) {
            x._customData._color[0] *= 3;
            x._customData._color[1] *= 3;
            x._customData._color[2] *= 3;
        }
        eventToNewID(x, 17, [50, 51], 4);
    }
    // Inner Light 10
    if (x._customData && x._type == 1 && isInID(x._customData._lightID, 18, 18)) {
        eventToNewID(x, 18, [52, 53], 4);
    }
    // Inner Light 1-8
    if (x._customData && x._type == 1 && isInID(x._customData._lightID, 1, 15)) {
        x._customData._lightID = x._customData._lightID / 2 + 0.5;
        if (x._time >= 201 && x._time < 260) eventToNewID(x, 1, 70, 1);
        else if (x._time >= 518 && x._time < 582) eventToNewID(x, 1, 70, 1);
        else eventToNewID(x, 1, 60, 1);
    }
    // Left Lasers
    if (x._customData && x._type == 2 && !x._customData._lightID && x._time > 1) {
        x._customData._lightID = 1;
        x._customData._color[0] *= 3;
        x._customData._color[1] *= 3;
        x._customData._color[2] *= 3;
        if (x._time < 582) eventToNewID(x, 1, [50, 64], 2);
        else eventToNewID(x, 1, [56, 58], 2);
    }
    // Right Lasers
    if (x._type == 3 && (!x._customData || (x._customData && !x._customData._lightID)) && x._time > 1) {
        if (!x._customData) x._customData = {};
        x._customData._lightID = 33;
        let y = copy(x);
        y._type = 2;
        map._events.push(y);
    }
    // Inner Light 11
    if (x._customData && x._type == 1 && isInID(x._customData._lightID, 19, 19)) {
        eventToNewID(x, 19, [55, 56], 1);
    }
    // Inner Light 12
    if (x._customData && x._type == 1 && isInID(x._customData._lightID, 20, 20)) {
        eventToNewID(x, 20, [57, 58], 1);
    }
    //  Inner Ring
    if (x._customData && x._type == 1 && !x._customData._lightID && x._time > 1) {
        x._customData._lightID = 1;
        x._customData._color[0] *= 0.6;
        x._customData._color[1] *= 0.6;
        x._customData._color[2] *= 0.6;
        x._customData._color[3] *= 10;
        eventToNewID(x, 1, [80, 85], 1);
    }
    // Back Lasers
    if (x._customData && x._type == 0 && !x._customData._lightID && x._time > 1) {
        x._customData._lightID = 1;
        x._customData._color[0] *= 9;
        x._customData._color[1] *= 9;
        x._customData._color[2] *= 9;
        x._customData._color[3] *= 0.2;
        eventToNewID(x, 1, 59, 1);
    }
})

// ------------- Output -------------

/*
    {
      "_beatmapCharacteristicName": "Lawless",
      "_difficultyBeatmaps": [
        {
          "_difficulty": "ExpertPlus",
          "_difficultyRank": 9,
          "_beatmapFilename": "ExpertPlusStandard_Old.dat",
          "_noteJumpMovementSpeed": 20,
          "_noteJumpStartBeatOffset": -0.5,
          "_customData": {
            "_difficultyLabel": "input (don\u0027t play)",
            "_colorLeft": {
              "r": 0.416,
              "g": 0.285,
              "b": 0
            },
            "_colorRight": {
              "r": 0.715,
              "g": 0.715,
              "b": 0.715
            },
            "_requirements": [
              "Chroma"
            ]
          }
        }
      ]
    },
*/

map._events.sort((a, b) => a._time - b._time);

expert._events = map._events;
expert._customData = map._customData;
expert._notes.forEach(x => {
    if (!x._customData) x._customData = {};
    x._customData._disableSpawnEffect = true;
    if (x._type == 3) x._customData._color = [0.59, 0.496, 0.35, 1];
})

fs.writeFileSync("ExpertPlusStandard.dat", JSON.stringify(map, null, 0));
fs.writeFileSync("ExpertStandard.dat", JSON.stringify(expert, null, 0));