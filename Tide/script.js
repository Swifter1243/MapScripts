#!node

const fs = require("fs");
let map = JSON.parse(fs.readFileSync("ExpertStandard.dat"));

const halfJumpDuration = 1.5;
const leftColor = [1, 0.494, 0, 1];
const rightColor = [0, 1, 0.931, 1];

///// ^^^^^ input ^^^^^ /////

map._customData._environment = [
    { // Removing box light from ring
        _id: "BigTrackLaneRing\\(Clone\\)\\.\\[\\d\\]NeonTubeBothSidesDirectional(\\s\\(\\d*\\))?\\.\\[\\d\\]BoxLight$",
        _lookupMethod: "Regex",
        _active: false
    },
    { // Removing rings from rings (ayo what)
        _id: "BigTrackLaneRing\\(Clone\\)\\.\\[\\d\\]Ring$",
        _lookupMethod: "Regex",
        _active: false
    },
    { // Removing box lights from front lights
        _id: "FrontLights\\.\\[\\d\\]NeonTube(\\s\\(1\\))?\\.\\[\\d\\]BoxLight$",
        _lookupMethod: "Regex",
        _active: false
    },
    { // Removing stupid and bad rectangle glow
        _id: "RectangleFakeGlow",
        _lookupMethod: "Contains",
        _active: false
    },
    {
        _id: "Frame",
        _lookupMethod: "Contains",
        _active: false
    },
    { // Removing construction
        _id: "Construction",
        _lookupMethod: "Contains",
        _active: false
    },
    { // Removing spectrograms
        _id: "Spectrograms",
        _lookupMethod: "Contains",
        _active: false
    },
    { // Removing floor
        _id: "Floor",
        _lookupMethod: "Contains",
        _active: false
    },
    { // Removing player mirror
        _id: "Mirror$",
        _lookupMethod: "Regex",
        _active: false
    },
    { // Removing backwards construction
        _id: "BackColumns$",
        _lookupMethod: "Regex",
        _active: false
    },
    { // Removing UI
        _id: "BasicGameHUD$",
        _lookupMethod: "Regex",
        _active: false
    },
    { // Removing extra glowlines
        _id: "NeonTubeDirectional(L|R)$",
        _lookupMethod: "Regex",
        _active: false
    },
    { // Setting up bottom light
        _id: "NeonTubeDirectionalFL$",
        _lookupMethod: "Regex",
        _scale: [0.1, 200, 20000],
        _position: [0, -0.11, 0]
    },
    { // Setting up backlight
        _id: "NeonTubeDirectionalFR$",
        _lookupMethod: "Regex",
        _scale: [100, 20000, 200000],
        _rotation: [0, 90, -30],
        _position: [0, 0.01, 400]
    },
    { // Scaling ring lasers
        _id: "BigTrackLaneRing\\(Clone\\)\\.\\[\\d\\]NeonTubeBothSidesDirectional(\\s\\(\\d*\\))?$",
        _lookupMethod: "Regex",
        _scale: [1, 9, 1]
    },
    // Buildings
    {
        _id: "NearBuildingLeft$",
        _lookupMethod: "Regex",
        _rotation: [0, 0, -30],
        _scale: [2, 2, 2],
        _position: [-30, 20, 100]
    },
    {
        _id: "NearBuildingLeft$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _rotation: [0, 0, 30],
        _scale: [0.2, 0.2, 0.2],
        _position: [-400, 3, 200]
    },
    {
        _id: "NearBuildingLeft$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _rotation: [0, 0, 10],
        _scale: [0.5, 0.2, 0.5],
        _position: [-20, 3, 210]
    },
    {
        _id: "NearBuildingLeft$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _rotation: [0, 0, -10],
        _scale: [0.5, 0.1, 0.5],
        _position: [-300, 10, 300]
    },
    {
        _id: "NearBuildingLeft$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _rotation: [0, 0, 30],
        _scale: [1, 1, 1],
        _position: [-210, 20, 310]
    },
    {
        _id: "NearBuildingRight$",
        _lookupMethod: "Regex",
        _rotation: [20, 0, 10],
        _scale: [4, 4, 4],
        _position: [20, 200, 150]
    },
    {
        _id: "NearBuildingRight$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _rotation: [-20, 0, -10],
        _scale: [0.3, 0.1, 0.3],
        _position: [360, 20, 310]
    },
    {
        _id: "NearBuildingRight$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _rotation: [15, 0, 4],
        _scale: [0.7, 0.3, 0.7],
        _position: [390, 20, 300]
    },
    {
        _id: "NearBuildingRight$",
        _lookupMethod: "Regex",
        _duplicate: 1,
        _rotation: [-20, 0, -10],
        _scale: [0.7, 0.3, 0.7],
        _position: [40, 30, 500]
    },
    { // Setting up smoke
        _id: "BigSmokePS",
        _lookupMethod: "Contains",
        _active: true,
        _scale: [5, 0.1, 5],
        _position: [0, -1.8, 0]
    }
]

// Moving rings
for (r = 1; r <= 15; r++) {
    rcenter = r - 8;

    map._customData._environment.push(
        {
            _id: "\\[" + r + "\\]BigTrackLaneRing\\(Clone\\)$",
            _lookupMethod: "Regex",
            _rotation: [14 * rcenter, 90 + 9 * rcenter, 0],
            _scale: [1, 1, 1],
            _position: [rcenter * 17, Math.abs(rcenter) * -13 + 80, 90]
        }
    );
}

for (r = 1; r <= 15; r++) {
    let pushObj = function pushObj() {
        rcenter = newR - 8.5;

        map._customData._environment.push(
            {
                _id: "\\[" + newR + "\\]BigTrackLaneRing\\(Clone\\)$",
                _lookupMethod: "Regex",
                _duplicate: 1,
                _rotation: [14 * rcenter, 90 + 9 * rcenter, 0],
                _scale: [2, 2, 2],
                _position: [rcenter * 40, (Math.abs(rcenter) * -13 + 80) * 3, 90],
                _lightID: 101
            }
        );
    }

    var newR = r;

    if (r == 8) pushObj();
    if (r >= 8) newR++;
    pushObj();
}

map._events.forEach(x => {
    if (x._type == 1 && x._customData && x._customData._lightID) {
        var ringID = x._customData._lightID[0];
        var newIDs = x._customData._lightID;

        if (ringID == 29) newIDs.push(104 + ringID, 105 + ringID, 106 + ringID, 107 + ringID);
        if (ringID > 29) ringID += 4;
        if (ringID >= 60) return;
        newIDs.push(100 + ringID, 101 + ringID, 102 + ringID, 103 + ringID);
    }
})

// Moving rotating lasers
for (s = -1; s <= 1; s += 2) {
    for (l = 0; l <= 3; l++) {
        if (l == 0) var pair = "RotatingLasersPair";
        else var pair = "RotatingLasersPair \\(" + l + "\\)";

        if (s == -1) var base = "BaseL";
        else var base = "BaseR";

        var id = pair + "\\.\\[\\d\\]" + base + "$";

        map._customData._environment.push(
            {
                _id: id,
                _lookupMethod: "Regex",
                _position: [(10 * s) + (4 * l * s), 100, 100],
                _track: "rotatingLaserS" + s + "L" + l,
                _scale: [0.5, 1, 1]
            }
        );

        map._customData._customEvents.push(
            {
                _time: 70,
                _type: "AnimateTrack",
                _data: {
                    _duration: 0,
                    _position: [[(10 * s) + (6 * l * s), 40, 60, 0]],
                    _track: "rotatingLaserS" + s + "L" + l,
                    _scale: [[0.1, 1, 1, 0]]
                }
            },
            {
                _time: 253,
                _type: "AnimateTrack",
                _data: {
                    _duration: 0,
                    _position: [[(30 * s) + (6 * l * s), 40, 140, 0]],
                    _track: "rotatingLaserS" + s + "L" + l,
                    _scale: [[0.01, 1, 1, 0]]
                }
            }
        )
    }
}

// Moving the middle lasers
for (s = -1; s <= 1; s += 2) {
    for (l = 0; l <= 4; l++) {
        var num = l * 2 + (s * 0.5 + 0.5);

        if (num == 0) id = "DoubleColorLaser$";
        else id = "DoubleColorLaser \\(" + num + "\\)$";

        map._customData._environment.push(
            {
                _id: id,
                _lookupMethod: "Regex",
                _position: [1 * s * l, 0, 100 + (l * 2)],
                _rotation: [0, 0, 0.1 * s * l]
            }
        );
    }
}

// Adjusting ring colors
map._events.forEach(x => {
    // Ring colors
    if (x._customData && x._type == 1) {
        x._customData._color[0] *= 4;
        x._customData._color[1] *= 4;
        x._customData._color[2] *= 4;
        x._customData._color[3] *= 0.02;
    }

    // Center lights lower
    if (x._customData && x._type == 4) {
        let mulValue = [0.5, 1];

        let multiply = function multiply(y, value) {
            y[0] *= value[0];
            y[1] *= value[0];
            y[2] *= value[0];
            y[3] *= value[1];
        }

        if (x._customData._color) multiply(x._customData._color, mulValue);
        if (x._customData._lightGradient && x._customData._lightGradient._startColor) multiply(x._customData._lightGradient._startColor, mulValue);
        if (x._customData._lightGradient && x._customData._lightGradient._endColor) multiply(x._customData._lightGradient._endColor, mulValue);
    }

    // Backlight colors
    if (x._customData && x._type == 3 && x._customData._lightID && x._customData._lightID.find(y => y == 5)) {
        x._customData._color[3] *= 0.7;
    }
});

// Lyrics stuff
var lyrics = [];
var objects = [];
var currentTime = 0;

const dissolveTime = 1.5; // Amount of time for walls to dissolve in and out
const transitionTime = 6; // Amount of time walls should take to transition
const hangMin = 1.5; // Minimum time walls should stay assembled for
const spreadMin = 0; // Min animation spread time
const spreadMax = 2; // Max animation spread time

map._obstacles.forEach(x => {
    x._time = roundTo(x._time, 0.01);

    if (x._customData && x._customData._track && x._customData._track == "lyrics") {
        if (x._time > currentTime) {
            currentTime = x._time;
            lyrics.push([currentTime, []]);
        }

        lyrics[lyrics.length - 1][1].push(x._customData);
    }
})

lyrics.push([300, []]);

map._obstacles = map._obstacles.filter(x => !(x._customData && x._customData._track && x._customData._track == "lyrics"));

lyrics.forEach(x => {
    objects.filter(y => y.state == "updated").forEach(y => {
        y.state = "active";
    })

    while (x[1].length > 0) {
        var available = objects.find(y => y.state == "active");
        var index = Math.round(randomFromRange(0, x[1].length - 1));
        var wall = x[1][index];

        var wallX = wall._position[0] + wall._animation._definitePosition[0][0];
        var wallY = wall._position[1] + wall._animation._definitePosition[0][1];

        var scaleX = wall._animation._scale[0][0];
        var scaleY = wall._animation._scale[0][1];
        var scaleZ = wall._animation._scale[0][2];

        if (available != undefined) {
            // if there is no missing walls
            available.keyframes.push({
                action: "move",
                time: x[0] - randomFromRange(spreadMin, spreadMax),
                position: [wallX, wallY, wall._animation._definitePosition[0][2]],
                rotation: [wall._localRotation[0], wall._localRotation[1], wall._localRotation[2]],
                scale: [scaleX, scaleY, scaleZ]
            })

            available.state = "updated";
        }
        else {
            // if there is a missing wall, add one
            objects.push({
                state: "updated",
                keyframes: [{
                    action: "start",
                    time: x[0],
                    position: [wallX, wallY, wall._animation._definitePosition[0][2]],
                    rotation: [wall._localRotation[0], wall._localRotation[1], wall._localRotation[2]],
                    scale: [scaleX, scaleY, scaleZ]
                }]
            })
        }

        x[1].splice(index, 1);
    }

    var hangTime = x[0] - transitionTime;
    if (hangTime < hangMin) hangTime = hangMin;

    var leftover = objects.filter(y => y.state == "active");
    if (leftover.length > 0) leftover.forEach(y => {
        y.state = "ended";
        y.keyframes.push({
            action: "end",
            time: hangTime
        })
    })
})

objects.forEach(object => {
    var start = object.keyframes[0];

    var beginning = start.time - halfJumpDuration - dissolveTime;
    var end = object.keyframes[object.keyframes.length - 1].time;
    var length = end - beginning;

    var wall = {
        _time: start.time - dissolveTime,
        _lineIndex: 0,
        _type: 0,
        _duration: length - halfJumpDuration,
        _width: 0,
        _customData: {
            _animation: {
                _definitePosition: [
                    [
                        randomSpread(start.position[0], 0.3),
                        randomSpread(start.position[1], 0.3),
                        randomSpread(start.position[2], 0.3), 0
                    ]
                ],
                _localRotation: [
                    [
                        randomSpread(start.rotation[0], 30) % 360,
                        randomSpread(start.rotation[1], 30) % 360,
                        randomSpread(start.rotation[2], 30) % 360, 0
                    ]
                ],
                _scale: [
                    [
                        randomSpread(start.scale[0], 0.08),
                        randomSpread(start.scale[1], 0.08),
                        randomSpread(start.scale[2], 0.08), 0
                    ]
                ],
                _dissolve: [
                    [0, 0],
                    [1, findKeyframe(beginning, length, start.time)]
                ]
            },
            _color: [0.8, 0.8, 0.8, 1],
            _scale: [0.083333336, 0.083333336, 0.083333336]
        }
    }

    for (i = 0; i < object.keyframes.length; i++) {
        var keyframe = object.keyframes[i];

        if (keyframe.action != "end") {
            var keytime = findKeyframe(beginning, length, keyframe.time);
            var hangTime = object.keyframes[i + 1].time - keyframe.time - transitionTime;
            if (hangTime < hangMin) hangTime = 1.5;

            wall._customData._animation._definitePosition.push(
                [
                    keyframe.position[0],
                    keyframe.position[1],
                    keyframe.position[2],
                    keytime,
                    "easeInOutExpo"
                ]
            )
            wall._customData._animation._localRotation.push(
                [
                    keyframe.rotation[0],
                    keyframe.rotation[1],
                    keyframe.rotation[2],
                    keytime,
                    "easeInOutExpo"
                ]
            )
            wall._customData._animation._scale.push(
                [
                    keyframe.scale[0],
                    keyframe.scale[1],
                    keyframe.scale[2],
                    keytime,
                    "easeInOutExpo"
                ]
            )

            keytime = findKeyframe(beginning, length, keyframe.time + hangTime);

            wall._customData._animation._definitePosition.push(
                [
                    randomSpread(keyframe.position[0], 0.05),
                    randomSpread(keyframe.position[1], 0.05),
                    randomSpread(keyframe.position[2], 0.05),
                    keytime
                ]
            )
            wall._customData._animation._localRotation.push(
                [
                    randomSpread(keyframe.rotation[0], 2) % 360,
                    randomSpread(keyframe.rotation[1], 2) % 360,
                    randomSpread(keyframe.rotation[2], 2) % 360,
                    keytime
                ]
            )
            wall._customData._animation._scale.push(
                [
                    randomSpread(keyframe.scale[0], 0.08),
                    randomSpread(keyframe.scale[1], 0.08),
                    randomSpread(keyframe.scale[2], 0.08),
                    keytime
                ]
            )
        }
        else {
            var startKeyframe = findKeyframe(beginning, length, keyframe.time - dissolveTime);
            var endKeyframe = findKeyframe(beginning, length, keyframe.time);

            wall._customData._animation._dissolve.push([
                1, startKeyframe
            ])
            wall._customData._animation._dissolve.push([
                0, endKeyframe
            ])



            var lastPosition = wall._customData._animation._definitePosition[wall._customData._animation._definitePosition.length - 1];
            lastPosition[3] = startKeyframe;
            wall._customData._animation._definitePosition.push([
                randomSpread(lastPosition[0], 0.1),
                randomSpread(lastPosition[1], 0.1),
                randomSpread(lastPosition[2], 0.1),
                endKeyframe
            ])

            var lastRotation = wall._customData._animation._localRotation[wall._customData._animation._localRotation.length - 1];
            lastRotation[3] = startKeyframe;
            wall._customData._animation._localRotation.push([
                randomSpread(lastRotation[0], 7) % 360,
                randomSpread(lastRotation[1], 7) % 360,
                randomSpread(lastRotation[2], 7) % 360,
                endKeyframe
            ])

            var lastScale = wall._customData._animation._scale[wall._customData._animation._scale.length - 1];
            lastScale[3] = startKeyframe;
            wall._customData._animation._scale.push([
                randomSpread(lastScale[0], 0.2),
                randomSpread(lastScale[1], 0.2),
                randomSpread(lastScale[2], 0.2),
                endKeyframe
            ])
        }
    }

    map._obstacles.push(wall);
})

function randomSpread(number, range) {
    return randomFromRange(number - range, number + range);
}

function findKeyframe(beginning, length, time) {
    var relativeTime = time - beginning;
    return relativeTime / length;
}

function roundTo(number, place) {
    return Math.round(number / place) * place;
}

function randomFromRange(start, end) {
    var size = end - start;
    return (Math.random() * size) + start;
}

const startParticles = 198;
const endParticles = 233;
const songEnd = 323;
const particlesPerBeat = 10;

for (i = startParticles; i <= songEnd; i++) {
    var progress = (i - startParticles) / (endParticles - startParticles);
    if (progress > 1) progress = 1;

    for (a = 0; a < progress * particlesPerBeat; a++) {
        var position = [randomFromRange(-80, 80), 0, randomFromRange(0, 50)];
        var scale = randomFromRange(0, (0.5 + Math.abs(position[0]) / 40)) * 12 / 2 * progress;
        var rotation = [randomFromRange(0, 360), randomFromRange(0, 360), randomFromRange(0, 360)];

        map._obstacles.push({
            _time: i + (a / particlesPerBeat),
            _lineIndex: 0,
            _type: 0,
            _duration: 5,
            _width: 0,
            _customData: {
                _track: "particle",
                _scale: [scale / 144, scale / 144, scale / 144],
                _animation: {
                    _definitePosition: [
                        [position[0], 0, position[2], 0],
                        [position[0], 1, position[2], 1, "easeOutExpo"]
                    ],
                    _scale: [
                        [scale, scale, scale, 0],
                        [0, 0, 0, 1]
                    ],
                    _localRotation: [
                        [rotation[0], rotation[1], rotation[2], 0],
                        [rotation[0] + randomFromRange(0, 360) % 360, rotation[1] + randomFromRange(0, 360) % 360, rotation[2] + randomFromRange(0, 360) % 360, 0]
                    ],
                    _dissolve: [[0, 0], [1, 0.1], [1, 0.3], [0, 1]],
                    _color: [
                        [10, 10, 10, 5, 0],
                        [0, 15, 15, 5, 0.5]
                    ]
                }
            }
        })
    }
}

function getNotesBetween(min, max) {
    return map._notes.filter(x => x._time >= min && x._time <= max);
}

function flipNoteFromCut(cutDir, _noteSide) {
    if (cutDir == 1) return 0;
    if (_noteSide > 0) return 180;
    else return -180;
}

function copy(obj) {
    if (typeof obj != 'object') return obj;

    var newObj = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        newObj[key] = copy(obj[key]);
    }
    return newObj
}

function lerp(start, end, fraction) {
    let difference = end - start;
    return start + (difference * fraction);
}

function lerpColor(start, end, fraction) {
    let x = lerp(start[0], end[0], fraction);
    let y = lerp(start[1], end[1], fraction);
    let z = lerp(start[2], end[2], fraction);
    return [x, y, z];
}

map._notes.forEach(x => {
    if (!x._customData) x._customData = {};
    if (!x._customData._animation) x._customData._animation = {};
    x._customData._noteJumpMovementSpeed = 19;
    x._customData._noteJumpStartBeatOffset = 1;
    if (x._type == 0) x._customData._color = copy(leftColor);
    if (x._type == 1) x._customData._color = copy(rightColor);
    x._customData._disableNoteGravity = true;
    x._customData._disableSpawnEffect = true;
})

// Intro notemods
map._customData._customEvents.push(
    {
        _time: 0,
        _type: "AnimateTrack",
        _data: {
            _duration: 0,
            _track: "blinkingNote",
            _dissolve: [[0, 0]],
            _dissolveArrow: [[0, 0]]
        }
    }
)

getNotesBetween(0, 69).forEach(x => {

    if (x._type != 3) {
        for (c = 0; c < 4; c++) {
            x._customData._color[c] *= 0.5;
        }
    }
})

for (i = 6; i < 29; i += 4) {
    var notes = getNotesBetween(i - 0.5, i + 3);

    for (j = 0; j < 4; j++) {
        var note = notes[j];

        var noteSide = note._lineIndex - 1.5;
        note._customData._animation._position = [[noteSide * 2, 0, 0, 0], [0, 0, 0, 0.45, "easeOutCirc"]];
        note._customData._animation._dissolve = [[0, 0], [1, 0.1], [0, 0.45]];
        note._customData._animation._dissolveArrow = [[0, 0], [1, 0.2]];
        note._customData._noteJumpMovementSpeed = 17;
        note._customData._noteJumpStartBeatOffset = 1.5;
    }

    note = notes[4];
    noteSide = note._lineIndex - 1.5;
    note._customData._animation._position = [[noteSide * -3, 0, 0, 0], [0, 0, 0, 0.48, "easeOutBack"]];
    note._customData._animation._rotation = [[-10, 0, 0, 0], [0, 0, 0, 0.48, "easeOutQuart"]];

    note._customData._track = "blinkingNote";
    note._customData._disableSpawnEffect = true;
    note._customData._noteJumpMovementSpeed = 17;
    note._customData._noteJumpStartBeatOffset = 1.5;

    var blinkTriggers = map._events.filter(x => x._time >= i + 0.5 && x._time <= i + 3 && x._value == 0 && x._type == 0);

    if (blinkTriggers.length > 0) blinkTriggers.forEach(x => {
        var dissolveArrow = [[1, 0], [1, 1], [0, 1]];
        if (blinkTriggers[blinkTriggers.length - 2]._time == x._time) dissolveArrow = [[1, 0]];

        map._customData._customEvents.push(
            {
                _time: x._time,
                _type: "AnimateTrack",
                _data: {
                    _duration: 0.08,
                    _track: "blinkingNote",
                    _dissolve: [[1, 0], [1, 1], [0, 1]],
                    _dissolveArrow: dissolveArrow
                }
            }
        )

        map._customData._customEvents.push(
            {
                _time: blinkTriggers[blinkTriggers.length - 1]._time,
                _type: "AnimateTrack",
                _data: {
                    _duration: 0,
                    _track: "blinkingNote",
                    _dissolve: [[0, 0]],
                    _dissolveArrow: [[0, 0]]
                }
            }
        )
    })
}

getNotesBetween(29.5, 30.5).forEach(note => {
    var noteSide = note._lineIndex - 1.5;
    note._customData._animation._position = [[noteSide * 2, 0, 0, 0], [0, 0, 0, 0.45, "easeOutCirc"]];
    note._customData._animation._dissolve = [[0, 0], [1, 0.1], [0, 0.45]];
    note._customData._animation._dissolveArrow = [[0, 0], [1, 0.2]];
    note._customData._noteJumpMovementSpeed = 17;
    note._customData._noteJumpStartBeatOffset = 1.5;
})

// Buildup notemods
getNotesBetween(30.5, 66).forEach(note => {
    noteSide = note._lineIndex - 1.5;

    note._customData._animation._position = [[noteSide * 2, -(note._lineLayer), 0, 0], [0, -(note._lineLayer), 0, 0.2, "easeOutCirc"], [0, 0, 0, 0.4, "easeInOutQuad"]];
    note._customData._animation._localRotation = [[0, 0, flipNoteFromCut(note._cutDirection, noteSide), 0.2], [0, 0, 0, 0.4, "easeInOutQuad"]];
    note._customData._animation._dissolve = [[0, 0], [1, 0.1]];
    note._customData._animation._dissolveArrow = [[0, 0], [1, 0.2]];
    note._customData._noteJumpMovementSpeed = 17;
    note._customData._noteJumpStartBeatOffset = 2.5;
})

// Drop notemods
getNotesBetween(70, 194).forEach(note => {
    note._customData._track = "drop";
    note._customData._noteJumpStartBeatOffset = 10;
    note._customData._noteJumpMovementSpeed = 19;

    note._customData._animation._dissolve = [[0, 0], [1, 0.25]];
    note._customData._animation._dissolveArrow = [[0, 0], [1, 0.25]];

    if (note._time == 70) {
        delete note._customData._track;
        delete note._customData._noteJumpMovementSpeed;
        delete note._customData._animation;
    }
})

map._customData._customEvents.push(
    {
        _time: 0,
        _type: "AnimateTrack",
        _data: {
            _duration: 0,
            _track: "drop",
            _dissolve: [[0, 0]],
            _dissolveArrow: [[0, 0]]
        }
    }
)

map._customData._customEvents.push(
    {
        _time: 70,
        _type: "AnimateTrack",
        _data: {
            _duration: 0.5,
            _track: "drop",
            _dissolve: [[0, 0], [1, 1]],
            _dissolveArrow: [[0, 0], [1, 1]]
        }
    }
)

map._customData._customEvents.push(
    {
        _time: 0,
        _type: "AssignPathAnimation",
        _data: {
            _duration: 0,
            _track: "drop",
            _position: [
                [20, 0, 50, 0],
                [0, 0, 0, 0.5]
            ]
        }
    }
)

map._customData._customEvents.push(
    {
        _time: 174,
        _type: "AssignPathAnimation",
        _data: {
            _duration: 4,
            _track: "drop",
            _easing: "easeOutExpo",
            _position: [
                [-9, 2, -50, 0.15],
                [0, 0, 0, 0.5, "easeInOutSine"]
            ],
            _localRotation: [
                [0, 0, 45, 0.15],
                [0, 0, 0, 0.5, "easeInOutSine"]
            ],
            _rotation: [
                [0, 0, -5, 0.15],
                [0, 0, 0, 0.5, "easeInOutSine"]
            ]
        }
    }
)

map._customData._customEvents.push(
    {
        _time: 182,
        _type: "AssignPathAnimation",
        _data: {
            _duration: 4,
            _track: "drop",
            _easing: "easeOutExpo",
            _position: [
                [9, 2, -40, 0.15],
                [0, 0, 0, 0.5, "easeInOutSine"]
            ],
            _localRotation: [
                [0, 0, 0, 0.15],
                [0, 0, 0, 0.5, "easeInOutSine"]
            ],
            _rotation: [
                [0, 0, 20, 0.15],
                [0, 0, 0, 0.5, "easeInOutSine"]
            ]
        }
    }
)

const longPathDuration = 12;
const shortPathDuration = 4;
var paths = [];

paths.push([[0, 12, -10], "long", 70]);

paths.push([[9 * 2, 12, -90 / 2], "long", 86]);
paths.push([[12 * 2, 6, -70 / 2], "short", 94]);
paths.push([[6 * 2, 3, -50 / 2], "short", 98]);
paths.push([[-3 * 2, 10, -20 / 2], "short", 102]);

paths.push([[-8 * 2, 12, -90 / 2], "long", 118]);
paths.push([[-12 * 2, 6, -70 / 2], "short", 126]);
paths.push([[-6 * 2, 3, -50 / 2], "short", 130]);
paths.push([[3 * 2, 10, -20 / 2], "short", 134]);

paths.push([[8 * 2, 12, -90 / 2], "long", 150]);
paths.push([[12 * 2, 6, -70 / 2], "short", 158]);
paths.push([[6 * 2, 3, -50 / 2], "short", 162]);
paths.push([[-3 * 2, 10, -20 / 2], "short", 166]);

paths.push([[-13, 3, -40 / 2], "short", 190]);


for (i = 0; i < paths.length; i++) {
    var path = paths[i];
    var pos = path[0];

    var pathDuration = longPathDuration;
    var easing = "easeInOutQuad";
    var offset = 0;

    if (path[1] == "short") {
        pathDuration = shortPathDuration;
        easing = "easeOutQuad";
        offset = shortPathDuration / 2;
    }

    map._customData._customEvents.push(
        {
            _time: path[2] - (pathDuration / 2) + offset,
            _type: "AssignPathAnimation",
            _data: {
                _duration: pathDuration,
                _track: "drop",
                _easing: easing,
                _position: [
                    [pos[0], pos[1], pos[2], 0.15],
                    [0, 0, 0, 0.5, "easeInOutSine"]
                ],
                _rotation: [[0, pos[0] * 0.9, 0, 0]]
            }
        }
    )
}

// Lead out of drop notemods
getNotesBetween(198, 231).forEach(note => {
    noteSide = note._lineIndex - 1.5;

    note._customData._noteJumpStartBeatOffset = 3;

    note._customData._animation._position = [[noteSide * 10, 0, 0, 0], [0, 0, 0, 0.45, "easeOutExpo"]];
    note._customData._animation._rotation = [[0, 0, noteSide * 10, 0], [0, 0, 0, 0]];
    note._customData._animation._dissolve = [[0, 0], [1, 0.4]];
    note._customData._animation._dissolveArrow = [[0, 0], [1, 0.4]];

    var fraction = 1 - ((231 - note._time) / (231 - 198));

    if (note._type == 0) note._customData._color = lerpColor(copy(leftColor), [0.8, 0.8, 0.8], fraction);
    if (note._type == 1) note._customData._color = lerpColor(copy(rightColor), [0.1215, 0.4588, 1], fraction);
})

// Lyric notemods
getNotesBetween(233, 285).forEach(note => {
    if (note._type == 0) note._customData._color = [0.8, 0.8, 0.8];
    if (note._type == 1) note._customData._color = [0.1215, 0.4588, 1];

    note._customData._noteJumpMovementSpeed = 15;
    note._customData._noteJumpStartBeatOffset = 2;

    note._customData._animation._dissolve = [[0, 0], [1, 0.2]];
    note._customData._animation._dissolveArrow = [[0, 0], [1, 0.2]];
    note._customData._animation._rotation = [[0, (Math.random() > 0.5 ? -1 : 1) * 10, 0, 0], [0, 0, 0, 0.5]];
    note._customData._animation._position = [[0, -note._lineLayer - 1, 0, 0], [0, 0, 0, 0.4, "easeOutSine"]];
})

// Outro nodemods

var lastTime = 287;
var offsets = [];

map._events.filter(x => x._time >= 291 && x._time <= 323 && x._type == 1).forEach(event => {
    var distance = event._time - lastTime;
    offsets.push([event._time, distance]);
    lastTime = event._time;
})

var lastOffset;

getNotesBetween(291, 323).forEach(note => {
    if (offsets.length > 0 && offsets[0][0] <= note._time) {
        lastOffset = offsets[0][1];
        offsets.splice(0, 1);
    }

    note._customData._disableNoteGravity = true;
    note._customData._noteJumpMovementSpeed = 20;
    note._customData._noteJumpStartBeatOffset = lastOffset / 2.5;

    if (note._type == 0) var noteColor = copy(leftColor);
    else var noteColor = copy(rightColor);
    if (note._type == 0) var noteColor2 = [0.8, 0.8, 0.8];
    else var noteColor2 = [0.1215, 0.4588, 1];

    var fraction = (note._time - 291) / (323 - 291);

    note._customData._animation._color = [[noteColor[0] * 2, noteColor[1] * 2, noteColor[2] * 2, 1, 0], [noteColor2[0], noteColor2[1], noteColor2[2], 1, 0.25]];
    note._customData._animation._dissolve = [[0, 0], [fraction + 0.1, 0], [0, 0.3]];
    note._customData._animation._position = [[0, 0, -20, 0], [0, 0, 0, 0.5]];
})

///// vvvvv output vvvvv /////

map._obstacles.forEach(x => {
    x._customData._noteJumpMovementSpeed = 19;
    x._customData._noteJumpStartBeatOffset = -0.5;

    var randSpread = Math.random();
    var duration = x._duration + (halfJumpDuration * 2);
    var newDuration = x._duration + (halfJumpDuration * 2) + randSpread;
    x._time -= randSpread;
    x._duration += randSpread;

    var timeOffset = (newDuration - duration) / newDuration;
    var timeMultiplier = 1 - timeOffset;

    if (x._customData) if (x._customData._animation) {
        for (const property in x._customData._animation) {
            x._customData._animation[property].forEach(element => {
                var timeElement = element.length - 1;
                if (typeof element[timeElement] === 'string') timeElement -= 1;

                element[timeElement] *= timeMultiplier;
                element[timeElement] += timeOffset;
            })
        }
    }
})

fs.writeFileSync("ExpertStandard.dat", JSON.stringify(map, null, 0));