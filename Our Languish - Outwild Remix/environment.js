#!node

const { reverse } = require("dns");
const noodlizer = require("../noodlizer.js");
const expertplus = noodlizer.load("ExpertPlusLawless.dat");
const expert = noodlizer.load("ExpertStandard.dat");
const three = require("three");
const { MathUtils, Vector3, Euler, Quaternion } = require("three");

///// ^^^^^ input ^^^^^ /////

expertplus._customData._customEvents = []

expertplus._customData._environment = [
  {
    _id: "RectangleFakeGlow",
    _lookupMethod: "Contains",
    _active: false
  },
  {
    _id: "MagicDoorSprite",
    _lookupMethod: "Contains",
    _active: false
  },
  {
    _id: "PillarPair",
    _lookupMethod: "Contains",
    _active: false
  },
  {
    _id: "SideLaser",
    _lookupMethod: "Contains",
    _active: false
  },
  {
    _id: "SmallPillarPair",
    _lookupMethod: "Contains",
    _active: true
  },
  {
    _id: "PillarPair.*\\.\\[[0-9]+\\]Pillar.\\.\\[[0-9]+\\]Pillar$",
    _lookupMethod: "Regex",
    _scale: [1, 1, 1]
  },
  {
    _id: "LowCloudsGenerator$",
    _lookupMethod: "Regex",
    _localPosition: [0, -1.25, 0]
  }
];

const playerHeight = 7;
const distance = 100; // 70

for (p = 0; p <= 3; p++) {
  for (s = -1; s <= 1; s += 2) {
    if (s == -1) var pillarSide = "PillarL";
    else var pillarSide = "PillarR";

    if (p == 0) var smallPillarName = "SmallPillarPair\\";
    else var smallPillarName = "SmallPillarPair \\(" + p + "\\)\\";

    var id = smallPillarName + ".\\[\\d\\]" + pillarSide + "$";

    var position = [15 * s, p * 10 - playerHeight + 5, (p * 20) - 10 + distance];

    expertplus._customData._environment.push(
      {
        _id: id,
        _lookupMethod: "Regex",
        _active: true,
        _position: position,
        _rotation: [0, 0, p * 20 * s],
        _scale: [1.5, 1.5, 1.5]
      }
    )
  }
}

for (p = 0; p <= 29; p++) {
  for (s = -1; s <= 1; s += 2) {
    if (s == -1) var ringSide = "PillarTrackLaneRingsR";
    else var ringSide = "PillarTrackLaneRingsR \\(1\\)";

    pflip = 29 - p;

    id = ringSide + "\\.\\[" + pflip + "\\]PillarTrackLaneRing\\(Clone\\)$";

    var mountainGap = 30;
    var spaceApart = 50;

    position = [spaceApart * s + pflip * mountainGap * s, p * 5 - 60 - playerHeight, 250 + distance];
    rotation = [(90 + (pflip * 4 * -1) - 30) * -1, -10 * s, 0];

    expertplus._customData._environment.push(
      {
        _id: id,
        _lookupMethod: "Regex",
        _active: true,
        _position: position,
        _rotation: rotation,
        _scale: [0.8, 0.8, 30]
      }
    )
  }
}

// Mountain clouds to the side
for (s = -1; s <= 1; s += 2) {
  let lowCloudRotation = [180, -30 * s, -110 * s];
  let lowCloudPosition = [230 * s, 100 - playerHeight, 420 + distance];

  if (s == -1) var cloudID = "\\]Clouds";
  else cloudID = "\\]Clouds\\(Clone\\)";

  expertplus._customData._environment.push(
    {
      _id: `${cloudID}$`,
      _lookupMethod: "Regex",
      _duplicate: 1,
      _position: lowCloudPosition,
      _rotation: lowCloudRotation
    },
    {
      _id: `${cloudID}\\(Clone\\)\\.\\[\\d\\]HighCloudsGenerator$`,
      _lookupMethod: "Regex",
      _active: false
    },
    {
      _id: `${cloudID}\\(Clone\\)\\.\\[\\d\\]LowCloudsGenerator$`,
      _lookupMethod: "Regex",
      _scale: [0, 0, 0],
      _track: `lowClouds${s}`
    }
  )

  expertplus._customData._customEvents.push(
    {
      _time: 394,
      _type: "AnimateTrack",
      _data: {
        _track: `lowClouds${s}`,
        _duration: 64,
        _localRotation: [[0,-90 * s,0,0],[0,45 * s,0,0.5],[0,180 * s,0,1]],
        _scale: [[3, 3, 3, 0]]
      }
    },
    {
      _time: 458,
      _type: "AnimateTrack",
      _data: {
        _track: `lowClouds${s}`,
        _duration: 64,
        _localRotation: [[0,-180 * s,0,0],[0,-360 * s,0,1]]
      }
    },
    {
      _time: 522,
      _type: "AnimateTrack",
      _data: {
        _track: `lowClouds${s}`,
        _duration: 84,
        _localRotation: [[0,0,0,0],[0,30 * s,0,1]]
      }
    }
  )
}

for (s = -1; s <= 1; s += 2) {
  expertplus._customData._environment.push(
    {
      _id: "HighCloudsGenerator$",
      _lookupMethod: "Regex",
      _duplicate: 1,
      _rotation: [0, 0, 10 * s],
      _position: [0, 20 - playerHeight, distance - 50],
      _scale: [0, 0, 0],
      _track: "highClouds"
    }
  )
}

// Can be lit by using missing lightIDs from side lasers
for (p = 0; p <= 3; p++) {
  for (s = -1; s <= 1; s += 2) {
    if (p == 0) smallPillarName = "SmallPillarPair\\.";
    else smallPillarName = "SmallPillarPair \\(" + p + "\\)\\.";

    if (s == -1) var laserName = "PillarL\\.\\[\\d\\]RotationBaseL$";
    else var laserName = "PillarR\\.\\[\\d\\]RotationBaseR$";

    position = [(-10 * p * s), 0 - playerHeight, 120 + distance];
    if (p > 1) position = [(-35 * p * s), 2 - playerHeight, 80 + distance]

    expertplus._customData._environment.push(
      {
        _id: smallPillarName + "\\[\\d\\]" + laserName,
        _lookupMethod: "Regex",
        _duplicate: 1,
        _position: position,
        _scale: [0, 0, 0],
        _rotation: [90, p * -60 * s, p * -90 * s],
        _track: "lasers"
      }
    )
  }
}

expertplus._customData._environment.push(
  {
    _id: "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]RotationBaseL$",
    _lookupMethod: "Regex",
    _duplicate: 1,
    _position: [0, -500, 640 + distance],
    _scale: [0, 0, 0],
    _rotation: [80, 0, 0],
    _track: "backLight"
  }
)

const newColors = [1 / 10, 1 / 10, 1 / 10, 2]

expertplus._events.forEach(x => {
  if (x._customData && x._customData._lightID && x._type == 2) {

    var lightID = x._customData._lightID[0];

    if ((lightID - 1) % 6 == 0) {
      var index = (lightID - 1) / 6;
      var newID = index * 3 + 28;

      var y = copy(x);
      if (y._customData._color && (y._time < 522 || index > 1) && index < 4) changeColor(y._customData._color, newColors);
      if (y._customData._color && (y._time < 522) && index == 1) changeColor(y._customData._color, newColors);
      if (y._customData._color && (y._time < 522) && index >= 4) changeColor(y._customData._color, [1, 1, 1, 1.2]);


      if (index < 4) {
        for (t = 2; t <= 3; t++) {
          z = copy(y);

          z._type = t;
          z._customData._lightID = [newID, newID + 1, newID + 2];

          if (index > 1 && z._customData._color) z._customData._color[3] *= 100;

          expertplus._events.push(z);
        }
      }
      if (index >= 4) {
        y._type = 2;
        y._customData._lightID = [newID, newID + 1, newID + 2];

        if (index > 1 && y._customData._color) y._customData._color[3] *= 100;

        expertplus._events.push(y);
      }
    }
  }
});

function copy(x) {
  return JSON.parse(JSON.stringify(x))
}

function time(length, input) {
  return input / length;
}

expertplus._customData._customEvents.push(
  {
    _time: 394,
    _type: "AnimateTrack",
    _data: {
      _track: "highClouds",
      _duration: 0,
      _scale: [[2, 2, 2, 0]]
    }
  },
  {
    _time: 394,
    _type: "AnimateTrack",
    _data: {
      _track: "lasers",
      _duration: 0,
      _scale: [[0.0001, 0.0001, 1, 0]]
    }
  },
  {
    _time: 394,
    _type: "AnimateTrack",
    _data: {
      _track: "backLight",
      _duration: 0,
      _position: [0, -500, 640 + distance],
      _scale: [[100000, 0.05, 1, 0]]
    }
  },
  // First drop animation
  {
    _time: 162,
    _type: "AnimateTrack",
    _data: {
      _track: "backLight",
      _duration: 0,
      _position: [0, -500, 210 + distance],
      _scale: [[100000, 0.05, 1, 0]]
    }
  },
  {
    _time: 170,
    _type: "AnimateTrack",
    _data: {
      _track: "backLight",
      _duration: 0,
      _position: [0, -500, -50 + distance],
      _scale: [[0, 0, 0, 0]]
    }
  }
)

function radians(x) {
  if (typeof x === "number") return copy(x) * MathUtils.DEG2RAD;
  else return copy(x).map(function (y) { return y * MathUtils.DEG2RAD });
}

function degrees(x) {
  if (typeof x === "number") return copy(x) * MathUtils.RAD2DEG;
  else return copy(x).map(function (y) { return y * MathUtils.RAD2DEG });
}

function changeColor(x, change) {
  x[0] *= change[0];
  x[1] *= change[1];
  x[2] *= change[2];
  x[3] *= change[3];
}

// todo: REMOVE THE NOODLE REQUIREMENT DUMBASS (FROM BOTH DIFFS)
// todo: animate the clouds to slowly move

///// vvvvv output vvvvv /////
expert._events = expertplus._events;
expert._customData = expertplus._customData;

expertplus.save("ExpertPlusStandard.dat");
expert.save("ExpertStandard.dat");