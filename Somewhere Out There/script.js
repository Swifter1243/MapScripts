const mapInput = "ExpertPlusStandard.dat"

const fs = require("fs");
const { off } = require("process");
const three = require("three");
let map = JSON.parse(fs.readFileSync(mapInput));
const pillarToNoodleUnits = 0.1495;
const glowLightToUnit = 0.0012;
const solidLightToUnit = 0.00024;
const lyricSpace = 0.2;
let transforms = {};

/*
TODO:
- Nothing! :)
*/

function getAppendTransform(group, time) {
	appends = appends.sort((a, b) => a[1] - b[1]);

	let value = {};
	appends.forEach(x => {
		if (x[0] == group && x[1] <= time) {
			let obj = x[2];

			applyTransformFromObj(value, obj);
		}
	});
	return value;
}

function getAppendProperty(group, time, property) {
	appends = appends.sort((a, b) => a[1] - b[1]);

	let value = undefined;
	appends.forEach(x => {
		if (x[0] == group && x[1] <= time) {
			let obj = x[2];

			if (obj[property] != null) value = obj[property];
		}
	})
	return value;
}

function isInID(lightID, start, end) {
	if (typeof lightID === "object") {
		let passed = false;
		lightID.forEach(z => {
			if (z >= start && z <= end) passed = true;
		})
		if (passed) return true;
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

function combineAnimations(anim1, anim2) {
	anim1 = copy(anim1);
	anim2 = copy(anim2);
	for (const key in anim1) {
		let property = anim1[key];
		let original = [0, 0, 0];
		if (key == "_scale") original = [1, 1, 1];
		if (anim2[key]) original = anim2[key];

		let editElem = function (e) {
			for (j = 0; j < 3; j++) {
				if (key == "_position") e[j] += original[j];
				if (key == "_rotation") e[j] = (e[j] + original[j]) % 360;
				if (key == "_scale") e[j] *= original[j];
			}
		}

		if (typeof property[0] == "object") {
			for (i = 0; i < property.length; i++) {
				editElem(property[i]);
			}
		}
		else editElem(property);

		anim2[key] = property;
	}
	return anim2;
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

function findKeyframe(beginning, length, time) {
	let relativeTime = time - beginning;
	if (length == 0) return 0;
	return relativeTime / length;
}

function movePlayer(position, rotation, timestamps, easing, parentEnv) {
	let time = timestamps[0][1];
	let endTime = timestamps[timestamps.length - 1][1];
	let positions = [];

	time += 0.069;

	timestamps.forEach(y => {
		let keyframe = findKeyframe(time, endTime - time, y[1]);
		positions.push([position[0], position[1], position[2] + y[0] + lookupOffset(time), keyframe, easing])
	})

	let playerTransform = {
		_position: positions,
		_rotation: rotation,
		_scale: [1, 1, 1]
	}

	registeredEnv.forEach(x => {
		if (x._follow) {
			let objTransform = {};
			let follow = getAppendProperty(x._group, time, "_follow");
			if (follow == undefined) follow = true;

			applyTransformFromObj(objTransform, x)

			objTransform = combineAnimations(objTransform, getAppendTransform(x._group, time));
			if (parentEnv) objTransform = combineAnimations(playerTransform, objTransform);
			else objTransform = combineAnimations(objTransform, { _position: [0, 0, lookupOffset(time)] });

			if (!follow) for (let y in objTransform) {
				if (typeof objTransform[y][0] == "object") {
					let transform = objTransform[y][0];
					let newTransform = [];

					for (i = 0; i <= 2; i++) {
						newTransform[i] = transform[i];
					}

					objTransform[y] = newTransform;
				}
			}

			let data = {
				_track: x._track,
				_duration: endTime - time
			}

			applyTransformFromObj(data, objTransform);

			map._customData._customEvents.push({
				_time: time,
				_type: "AnimateTrack",
				_data: data
			})

			//console.log(map._customData._customEvents[map._customData._customEvents.length - 1]);
		}
	})

	map._customData._customEvents.push(
		{
			_time: time,
			_type: "AnimateTrack",
			_data: {
				_track: "noteChild",
				_duration: endTime - time,
				_rotation: rotation
			}
		},
		{
			_time: time,
			_type: "AnimateTrack",
			_data: {
				_track: "note",
				_duration: endTime - time,
				_position: positions
			}
		},
		{
			_time: time,
			_type: "AnimateTrack",
			_data: {
				_track: "feet",
				_duration: endTime - time,
				_position: positions,
				_localRotation: rotation
			}
		},
		{
			_time: time,
			_type: "AnimateTrack",
			_data: {
				_track: "player",
				_duration: endTime - time,
				_position: positions,
				_localRotation: rotation
			}
		}
	);
}

function switchToModel(trackName, time) {
	let cubes = 0;
	map._notes.forEach(x => {
		if (x._customData && x._customData._track == trackName) {
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
			pillarPos[2] += offset[2] + lookupOffset(time);

			map._customData._customEvents.push({
				_time: time,
				_type: "AnimateTrack",
				_data: {
					_track: `track${cubes}`,
					_duration: 0,
					_position: [...pillarPos],
					_scale: [...pillarScale],
					_rotation: [...pillarRot]
				}
			})

			cubes++;
		}
	});

	// map._customData._customEvents.push({
	//     _time: time,
	//     _type: "AnimateTrack",
	//     _data: {
	//         _track: "environment",
	//         _duration: 0,
	//         _position: [...pillarPos]
	//     }
	// })

	if (cubes < lastCubes) {
		for (let i = cubes; i < lastCubes; i++) {
			map._customData._customEvents.push({
				_time: time,
				_type: "AnimateTrack",
				_data: {
					_track: `track${i}`,
					_duration: 0,
					_position: [0, -69420, 0]
				}
			})
		}
	}

	if (cubes > totalCubes) totalCubes = cubes;
	lastCubes = cubes;
	map._notes = map._notes.filter(x => !x._customData || (x._customData._track !== trackName));
}

function registerLight(solid, pos, rot, scale, ID, group, follow) {
	let envID;
	if (solid) envID = "SmallPillarPair\\.\\[\\d\\]PillarL\\.\\[\\d\\]LaserL$";
	else envID = "Environment\\.\\[\\d*\\]GlowLineH$";

	map._customData._environment.push({
		_id: envID,
		_lookupMethod: "Regex",
		_duplicate: 1,
		_position: pos,
		_rotation: rot,
		_scale: scale,
		_lightID: ID,
		_group: group,
		_follow: follow
	})
}

function applyTransformFromObj(target, object) {
	let output = {};
	for (const key in object) {
		if (
			key == "_position" ||
			key == "_rotation" ||
			key == "_scale"
		) target[key] = object[key];
	}

	return output;
}

function recolor(object, rgb, alpha) {
	if (object._customData._color) {
		object._customData._color[0] *= rgb;
		object._customData._color[1] *= rgb;
		object._customData._color[2] *= rgb;
		object._customData._color[3] *= alpha;
	}
}

function animateGroup(animations) {
	animations.forEach(animation => {
		let group = animation[0];
		let time = animation[1];
		let duration = animation[2];
		let anim = animation[3];

		registeredEnv.forEach(x => {
			if (x._group == group) {

				let data = {
					_track: x._track,
					_duration: duration
				}

				let objTransform = [];
				let offset = { _position: [0, 0, lookupOffset(time)] }

				applyTransformFromObj(objTransform, x);
				objTransform = combineAnimations(anim, objTransform);
				objTransform = combineAnimations(objTransform, offset);
				applyTransformFromObj(data, objTransform);

				//if (group.includes("lyric")) console.log(data);

				map._customData._customEvents.push({
					_time: time,
					_type: "AnimateTrack",
					_data: data
				})
			}
		})
	})
}

function rand(start, end) {
	var size = end - start;
	return (Math.random() * size) + start;
}

function lookupOffset(time) {
	jumps = jumps.sort((a, b) => a - b);

	let jump = 200;
	jumps.forEach(x => {
		if (x <= time) jump += 300;
	})

	return jump;
}

function setLaserPos(trackName, time, doubleSided, solid, yOffset) {
	let filteredNotes = map._notes.filter(x => x._customData && x._customData._track == trackName).sort(
		(a, b) => a._customData._animation._definitePosition[0][2] - b._customData._animation._definitePosition[0][2]
	);
	let laserAmount = 0;

	let laserY = -0;
	if (doubleSided) laserY = -500;
	if (!solid) laserY = 0;

	filteredNotes.forEach(x => {
		if (x._customData && x._customData._track == trackName) {
			let y = copy(x);

			let laserPos = y._customData._animation._definitePosition[0];
			let laserRot = y._customData._animation._localRotation[0];

			laserPos.pop();
			laserRot.pop();

			let laserID = "solid";
			if (!solid) {
				laserID = "glow";
				laserRot[0] = (laserRot[0] + 180) % 360;
			}

			let offset = vectorFromRotation(laserRot, laserY);

			laserPos[1] += 0.09;
			laserPos[2] += 0.65 * (1 / 0.6);

			laserPos[0] += offset[0];
			laserPos[1] += offset[1];
			laserPos[2] += offset[2];

			if (yOffset != null) laserPos[1] += yOffset;

			animateGroup([[`${laserID}${laserAmount}`, time, 0, {
				_position: [...laserPos],
				_scale: [1, 4, 1],
				_rotation: [...laserRot]
			}]])

			laserAmount++;
		}
	});

	map._notes = map._notes.filter(x => !x._customData || (x._customData._track !== trackName));
}

function animateLyrics(time, data) {
	time -= -0.1;

	let rotationData = {
		_track: "lyricsParent",
		_duration: 0
	}

	let positionData = {
		_track: "lyricsParent2",
		_duration: 0
	}

	for (const key in data) {
		if (
			key == "_position"
		) positionData[key] = data[key];
	}

	for (const key in data) {
		if (
			key == "_rotation"
		) rotationData[key] = data[key];
	}

	map._customData._customEvents.push({
		_time: time,
		_type: "AnimateTrack",
		_data: positionData
	})

	map._customData._customEvents.push({
		_time: time,
		_type: "AnimateTrack",
		_data: rotationData
	})
}

function getTransformFromNote(noteName) {
	map._notes.forEach(x => {
		if (x._customData && x._customData._track == noteName) {
			var y = copy(x);

			var objPos = y._customData._animation._definitePosition[0];
			var objRot = y._customData._animation._localRotation[0];
			var objScale = y._customData._animation._scale[0];

			objPos[1] -= 0.09;
			objPos[2] -= 0.65 * (1 / 0.6);

			objPos.pop();
			objRot.pop();
			objScale.pop();

			transforms[noteName] = {
				_position: objPos,
				_rotation: objRot,
				_scale: objScale
			}
		}
	});

	map._notes = map._notes.filter(x => !x._customData || (x._customData._track !== noteName));
}

let registeredEnv = [];
let appends = [];

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
		_id: "TrackMirror",
		_lookupMethod: "Contains",
		_active: false
	},
	{
		_id: "MagicDoorSprite",
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
		_id: "Environment\\.\\[\\d*\\]GlowLine",
		_lookupMethod: "Regex",
		_position: [0, -69420, 0]
	},
	// {
	//     _id: "CoreLighting\\.\\[\\d\\]DirectionalLight$",
	//     _lookupMethod: "Regex",
	//     _active: false
	// },
	{ // Layer 1
		_id: "HighCloudsGenerator$",
		_lookupMethod: "Regex",
		_scale: [3, 1, 1.2],
		_position: [0, 5, 0],
		_group: "highClouds",
		_follow: true
	},
	{ // Layer 2
		_id: "HighCloudsGenerator$",
		_lookupMethod: "Regex",
		_duplicate: 1,
		_scale: [3, 1.5, 2],
		_position: [0, 30, 0],
		_rotation: [0, 180, 0],
		_group: "highClouds",
		_follow: true
	},
	{ // Layer 3
		_id: "HighCloudsGenerator$",
		_lookupMethod: "Regex",
		_duplicate: 1,
		_scale: [3, 4, 2.5],
		_position: [0, 50, 0],
		_group: "highClouds",
		_follow: true
	},
	{ // Layer 3
		_id: "HighCloudsGenerator$",
		_lookupMethod: "Regex",
		_duplicate: 1,
		_scale: [3, 4, 2],
		_position: [0, 100, 0],
		_rotation: [0, 180, 0],
		_group: "highClouds",
		_follow: true
	},
	{
		_id: "Feet",
		_lookupMethod: "Contains",
		_track: "feetChild"
	},
	{
		_id: "Feet",
		_duplicate: 5,
		_lookupMethod: "Contains",
		_track: "feetChild"
	},
	{
		_id: "LowCloudsGenerator",
		_lookupMethod: "Contains",
		_group: "lowClouds",
		_scale: [2, 1, 2],
		_position: [0, 5, 0]
	},
	{
		_id: "LowCloudsGenerator",
		_lookupMethod: "Contains",
		_group: "lowClouds",
		_duplicate: 1,
		_scale: [2, 1, 2],
		_position: [0, 5, 0],
		_rotation: [0, 180, 0]
	},
	{
		_id: "CoreLighting.\\[3\\]DirectionalLight$",
		_lookupMethod: "Regex",
		_group: "mountainLight"
	}
]

// Turning off lights initially :)
map._events.push({
	_time: 0,
	_type: 0,
	_value: 1,
	_customData: {
		_color: [0, 0, 0, 0]
	}
})

for (i = 1; i <= 4; i++) {
	map._events.push({
		_time: 0,
		_type: i,
		_value: 0
	})
}

/*
LIGHT TYPES:
- BACK LASERS = Block reflection color
- BACK LASERS 1 = Backlight
- INNER RING ALL = Movable solid lasers
- LEFT LASERS ALL = Movable glow lasers
- CENTER LIGHTS = Main glow
- CENTER LIGHTS 2 = Sub glow
*/

// Registering light stuff
registerLight(true, [0, 0, 500], [0, 0, 0], [1000000, 4, 1], 50, "backlight", true) // Backlight: (1)
registerLight(false, [5, 10, 50], [0, 0, -90], [1, 100, 1], 50, "mainGlow", true) // Main glow: (4)
registerLight(false, [-5, 10, 50], [0, 0, 90], [1, 100, 1], 51, "mainGlow", true) // Main glow: (4)
registerLight(false, [0, 5, 50], [0, 0, 0], [1, 0.0001, 1], 52, "subGlow", true) // Sub glow: (4)

for (i = 0; i <= 12; i++) {
	registerLight(true, [0, 0, 0], [0, 0, 0], [1, 1, 1], 60, `solid${i}`, false) // Solid Lasers (1) (60-72)
}

for (i = 0; i <= 9; i++) {
	registerLight(false, [0, -500, 0], [0, 0, 0], [1, 1, 1], 60, `glow${i}`, false) // Glow Lasers (4) (60-69)
}

for (i = 0; i <= 7; i++) {
	registerLight(false, [0, 0, 0], [0, 0, 0], [1, 1, 1], 80, `glow2${i}`, true) // Secondary Glow Lasers (4) (80-89)
}


let sides = {};
let preRegisterAnimations = [];

map._events.forEach(x => {
	// Backlight
	if (x._customData && x._type == 0 && ((x._customData && isInID(x._customData._lightID, 1, 1)) || x._value == 0) && x._time >= 1) {
		if (!x._customData._lightID) x._customData._lightID = 0;
		recolor(x, 1, 3);
		eventToNewID(x, 1, 50, 1);
	}
	// Main Glow
	if (x._customData && x._type == 4 && !x._customData._lightID && x._time > 1) {
		x._customData._lightID = 1;
		recolor(x, 5, 4);
		eventToNewID(x, 1, [50, 51], 4);
	}
	// Sub Glow
	if (x._customData && x._type == 4 && ((x._customData && isInID(x._customData._lightID, 1, 1)) || x._value == 0) && x._time >= 1) {
		if (!x._customData._lightID) x._customData._lightID = 0;
		recolor(x, 5, 5);
		eventToNewID(x, 1, 52, 4);
	}
	// Solid Lasers
	if (x._type == 1 && ((x._customData && isInID(x._customData._lightID, 1, 20)) || (x._customData && !x._customData._lightID) || x._value == 0) && x._time >= 1) {
		if (!x._customData) x._customData = {};

		let oldlightID = copy(x._customData._lightID);
		let lightID = x._customData._lightID;
		lightID = (lightID - 1) / 2 + 1;
		if (lightID >= 8.5) lightID = oldlightID - 8;
		x._customData._lightID = lightID;
		if (!lightID) x._customData._lightID = 0;

		if (x._value == 0 && x._time >= 325 && x._time < 454) {
			let keyframe = findKeyframe(325, 454 - 325, x._time)
			let time = 1 - Math.cos((keyframe * Math.PI) / 2);
			let Zpos = 500 * time + 40;
			let newLightID = x._customData._lightID;

			if (!sides[newLightID]) sides[newLightID] = -1;
			sides[newLightID] *= -1;

			let position = [20 * sides[newLightID], -50, Zpos + (newLightID * 10)];
			if (newLightID > 5) position = [10 * sides[newLightID], -50, Zpos + (newLightID * 5) + 10];

			preRegisterAnimations.push([`solid${newLightID}`, x._time, 0, {
				_position: position,
				_rotation: [0, 0, sides[newLightID] * newLightID * 1],
				_scale: [0.5, 0.5, 0.5]
			}])
		}

		recolor(x, 2, 1);
		eventToNewID(x, 0, 60, 1);
	}
	// Glow Lasers
	if (x._type == 2 && ((x._customData && isInID(x._customData._lightID, 1, 25)) || (x._customData && !x._customData._lightID) || x._value == 0) && x._time >= 1) {
		if (!x._customData) x._customData = {};
		let lightID = x._customData._lightID;
		lightID = (lightID - 1) / 3 + 1;
		x._customData._lightID = lightID;
		if (!lightID) x._customData._lightID = 0;

		recolor(x, 15, 0.3);
		eventToNewID(x, 0, 60, 4);
	}
	// Secondary Glow Lasers
	if (x._type == 3 && ((x._customData && isInID(x._customData._lightID, 1, 25)) || (x._customData && !x._customData._lightID) || x._value == 0) && x._time >= 1) {
		if (!x._customData) x._customData = {};
		let lightID = x._customData._lightID;
		lightID = (lightID - 1) / 3 + 1;
		x._customData._lightID = lightID;
		if (!lightID) x._customData._lightID = 0;

		x._time += 0.01;

		recolor(x, 4, 1);
		eventToNewID(x, 0, 80, 4);
	}
})

// Registering environment groups; all Environment stuff should be done by now
let trackID = 0;
map._customData._environment.forEach(x => {
	if (x._group) {
		x._track = `parentedObj${trackID}`;
		registeredEnv.push(x);
		trackID++;
	}
})

let jumps = [262, 454, 518, 550, 582, 614, 646, 678, 710];

appends.push(
	["highClouds", 0, {
		_scale: [0, 0, 0]
	}],
	["highClouds", 262, {
		_scale: [1, 1, 1]
	}],
	["highClouds", 518, {
		_scale: [1, 1, 1],
		_position: [0, 50, 0]
	}],
	["highClouds", 550, {
		_scale: [0, 0, 0]
	}],
	["highClouds", 582, {
		_scale: [1, 1, 1],
		_position: [0, 50, -20]
	}],
	["highClouds", 614, {
		_scale: [0, 0, 0]
	}],
	["highClouds", 646, {
		_scale: [1, 0.3, 0.2],
		_position: [0, 40, 500],
		_follow: false
	}],
	["highClouds", 678, {
		_scale: [0, 0, 0]
	}],
	["highClouds", 710, {
		_scale: [1, 0.5, 0.75],
		_position: [0, 30, 0],
		_follow: true
	}],
	["mainGlow", 0, {
		_position: [0, -8, 0]
	}],
	["mainGlow", 262, {
		_position: [0, 0, 0]
	}],
	["mainGlow", 518, {
		_position: [0, -8, 0]
	}],
	["mainGlow", 582, {
		_rotation: [0, 0, -6],
	}],
	["mainGlow", 614, {
		_rotation: [0, 0, 20],
	}],
	["mainGlow", 646, {
		_rotation: [0, 0, 0],
		_position: [0, -5, 0]
	}],
	["mainGlow", 678, {
		_position: [0, -8, 0]
	}],
	["mainGlow", 710, {
		_position: [0, 8, 0]
	}],
	["backlight", 0, {
		_position: [0, -100, -500],
		_rotation: [20, 0, 0]
	}],
	["backlight", 582, {
		_position: [0, -1000, 0],
		_rotation: [0, 0, 0]
	}],
	["backlight", 646, {
		_position: [0, 0, 200]
	}],
	["backlight", 678, {
		_position: [0, -1000, 0]
	}],
	["backlight", 710, {
		_position: [0, 0, 200]
	}]
)

for (i = 0; i <= 7; i++) {
	appends.push([`glow2${i}`, 0, {
		_position: [0, 5, 50],
		_rotation: [0, 0, 45 * i]
	}])
}

/*
LIGHT TYPES:
- BACK LASERS = Block reflection color
- BACK LASERS 1 = Backlight
- INNER RING ALL = Movable solid lasers
- LEFT LASERS ALL = Movable glow lasers
- RIGHT LASERS ALL = Secondary player glowing lasers
- CENTER LIGHTS = Main glow
- CENTER LIGHTS 1 = Sub glow
*/

animateGroup([
	["lowClouds", 0, 0, {
		_scale: [0, 0, 0]
	}],
	["lowClouds", 646, 0, {
		_scale: [1, 1, 1]
	}],
	["lowClouds", 678, 0, {
		_scale: [0, 0, 0]
	}],
	["mountainLight", 0, 0, {
		_rotation: [0, 355, -180]
	}],
	["mountainLight", 454, 518 - 454, {
		_rotation: [[18, 181, 180, 0], [2, 355, 180, 1, "easeInExpo"]]
	}],
	["mountainLight", 710, 0, {
		_rotation: [180, 0, 180]
	}]
])

// Sunset Lines: 710 - 826
let reflectionDist = 1.5;
let reflectionStart = 710;
let reflectionEnd = 826;
let reflectionDur = reflectionEnd - reflectionStart;
let reflectionRate = 8;
let reflectionAmount = 5;

for (let i = 0; i < reflectionAmount; i++) {
	let position = [];
	let scale = [];

	for (t = reflectionStart; t <= reflectionEnd; t += reflectionRate) {
		if (t + reflectionRate > reflectionEnd) t = reflectionEnd;

		let size = rand(3.5, 6.5) * ((reflectionAmount + 2) - i) / 2;
		let keyframe = findKeyframe(reflectionStart, reflectionDur, t);

		position.push([-size / 2, 10 + 1 - (reflectionDist * i), 100 - (i * 2), keyframe, "splineCatmullRom"]);
		scale.push([1, solidLightToUnit * size, 1, keyframe, "splineCatmullRom"]);
	}

	animateGroup([
		[`solid${i + 5}`, 710, reflectionDur, {
			_rotation: [-90, -90, 0],
			_scale: scale,
			_position: position
		}]
	])
}

let totalCubes = 0;
let lastCubes = 0;

switchToModel("shore", 262);
switchToModel("foggy_mountain", 454);
switchToModel("monoliths", 518);
switchToModel("blank", 550);
switchToModel("forest", 582);
switchToModel("blank", 614);
switchToModel("mountains", 646);
switchToModel("blank", 678);
switchToModel("horizon", 710);
switchToModel("blank", 824.5);

for (let i = 0; i < totalCubes; i++) {
	map._customData._environment.push({
		_id: "\\]PillarPair \\(1\\)\\.\\[0\\]PillarL\\.\\[0\\]Pillar$",
		_lookupMethod: "Regex",
		_duplicate: 1,
		_scale: [0, 0, 0],
		_track: `track${i}`,
		_active: true
	})
}

let monolithPlayerHeight = 124;

movePlayer([0, 1000, 0], [0, 0, 0], [[0, 0]], "easeLinear", true); // Intro
movePlayer([0, 0, 0], [0, 0, 0], [[0, 262], [0, 312], [-500, 312], [-500, 312.25], [0, 312.25], [0, 325], [500, 454]], "easeInSine", true); // Buildup
movePlayer([-48.996569980145935, 30.53325995503284, 9.674587313580925], [-7.3782344, 56.93054, 31.138575], [[0, 454]], "easeLinear", false); // Foggy Mountain
movePlayer([0, monolithPlayerHeight, 0], [0, 0, 0], [[0, 518], [100, 550]], "easeLinear", true); // Drop part 1
movePlayer([0, 1000, 0], [0, 0, 0], [[0, 550], [100, 582]], "easeLinear", true); // Drop part 2
movePlayer([0, 3, 0], [0, 0, 0], [[0, 582], [200, 614]], "easeLinear", true); // Drop part 3
movePlayer([0, 1000, 0], [0, 0, 0], [[0, 614], [200, 646]], "easeLinear", true); // Drop part 4
movePlayer([0, 50, 0], [0, 0, 0], [[0, 646], [200, 678]], "easeLinear", true); // Drop part 5
movePlayer([0, 1000, 0], [0, 0, 0], [[0, 678], [200, 710]], "easeLinear", true); // Drop part 6
movePlayer([0, 10, 0], [0, 0, 0], [[0, 710]], "easeLinear", true); // Outro

setLaserPos("introLight", 0, true, true);
setLaserPos("introLightGlow", 0, true, false);
setLaserPos("shoreLight", 262, true, true);
setLaserPos("foggyMountainLight", 454, false, true);
setLaserPos("foggyMountainLightGlow", 454, true, false);
setLaserPos("monolithsLight", 518, true, true);
setLaserPos("drop1Light", 550, true, true, 1000);
setLaserPos("drop2Light", 614, true, true, 1000);
setLaserPos("drop3Light", 678, true, true, 1000);
setLaserPos("forestLight", 582, false, true);
setLaserPos("mountainsLight", 646, false, true);
setLaserPos("horizonLight", 710, false, true);

getTransformFromNote("lyrics0");
getTransformFromNote("lyrics1");
getTransformFromNote("lyrics2");

animateLyrics(259, transforms["lyrics0"]);
animateLyrics(276, transforms["lyrics1"]);
animateLyrics(283, transforms["lyrics2"]);
animateLyrics(291, transforms["lyrics0"]);
animateLyrics(308, transforms["lyrics1"]);
animateLyrics(315, transforms["lyrics2"]);
animateLyrics(824.5, { _position: [0, 4, 30], _rotation: [0, 0, 0] });

animateGroup(preRegisterAnimations);

map._customData._customEvents.push(
	{
		_time: 0,
		_type: "AssignPlayerToTrack",
		_data: {
			_track: "player"
		}
	},
	{
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
			_childrenTracks: ["noteChild"],
			_parentTrack: "note"
		}
	},
	{
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
			_childrenTracks: ["lyrics"],
			_parentTrack: "lyricsParent"
		}
	},
	{
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
			_childrenTracks: ["lyricsParent"],
			_parentTrack: "lyricsParent2"
		}
	},
	{
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
			_childrenTracks: ["lyricsParent2"],
			_parentTrack: "note"
		}
	},
	{
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
			_childrenTracks: ["feetChild"],
			_parentTrack: "feet"
		}
	}
)

registeredEnv.forEach(x => {
	x._scale = [0, 0, 0];
	if (x._group) delete x._group;
});

// MAWNTEE CODE
//#region

// I moved this up here so it don't fuck with my shit lol thanks in advance bestie <333
map._notes.forEach(x => {
    if (!x._customData) x._customData = {};
    x._customData._track = "noteChild";
    x._customData._disableSpawnEffect = true;
    if (x._type == 3) x._customData._color = [0.59, 0.496, 0.35, 1];
})

// ignore this dumb shit
let difficulty = map;
if (!difficulty._customData) {
    difficulty._customData = { _pointDefinitions: [], _customEvents: [], _environment: [] };
}
const _customData = difficulty._customData;
if (!difficulty._customData._pointDefinitions) { difficulty._customData._pointDefinitions = []; }
if (!difficulty._customData._customEvents) { difficulty._customData._customEvents = []; }
if (!difficulty._customData._environment) { difficulty._customData._environment = []; }

const _obstacles = difficulty._obstacles;
const _notes = difficulty._notes;
const _customEvents = _customData._customEvents;
const _pointDefinitions = _customData._pointDefinitions;
const _environment = _customData._environment;

let filterednotes;

_obstacles.forEach(wall => {
    if (!wall._customData) {
        wall._customData = {};
    }
});

_notes.forEach(note => {
    if (!note._customData) {
        note._customData = {};
    }
});

function rnd(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function trackOnNotesBetween(track, p1, p2, potentialOffset) {
    filterednotes = _notes.filter(n => n._time >= p1 && n._time <= p2);
    filterednotes.forEach(object => {
        object._customData._track = track;
        if (typeof potentialOffset !== "undefined") {
            object._customData._noteJumpStartBeatOffset = potentialOffset;
        }
    });
    return filterednotes;
}
// okay stop ignoring this shit now, all the cool stuff is below :)
//#region Intro random




var blurSamples = 4
var blurSpacing = 8

filterednotes = _notes.filter(n => n._time >= 0 && n._time < 134);
filterednotes.forEach(note => {
  if (note._customData._fake != true) {
    note._customData._disableNoteGravity = true;
	note._customData._disableSpawnEffect = true;
    note._customData._noteJumpMovementSpeed = 12;
    note._customData._noteJumpStartBeatOffset = 4;
	note._customData._animation = {}
	note._customData._animation._position = [[0,0,-20,0], [0,0,0,0.5, "easeOutSine"]]
    note._customData._animation._rotation = [[getRndInteger(-5,5), getRndInteger(-5,5), getRndInteger(-180,180), 0], [0, 0, 0, 0.4375, "easeOutQuad"]];
    note._customData._animation._localRotation = [[getRndInteger(-15,15), getRndInteger(-15,15), getRndInteger(-15,15), 0], [0, 0, 0, 0.4375, "easeInOutCubic"]];
	note._customData._animation._dissolve = [[0,0],[1,0.375, "easeOutQuad"]];
	note._customData._animation._scale = [[0.2,0.2,0.2,0], [1,1,1,0.375, "easeOutCubic"]];
  for (let index = 0; index < blurSamples/2; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
    n1._time += (blurSpacing*0.01337)*(index*2)
	n1._customData._noteJumpStartBeatOffset = 8;
    n1._customData._animation._dissolveArrow = [[0,0.2499],[0.3,0.25],[0,0.475 - (index*0.005), "easeInCubic"]];
    n1._customData._animation._dissolve = [[0,0.2499],[0.15,0.25],[0,0.4375 - (index*0.005), "easeInOutQuad"]];
    n1._customData._animation._scale = [[0.25,0.25,0.25,0.25],[1.5,1.5,0.9,0.4375 - (index*0.005), "easeInCubic"]];
    n1._customData._fake = true;
    n1._customData._interactable = false;
    n1._customData._disableNoteGravity = true;
    _notes.push(n1);
  }
}
}); 


filterednotes = _notes.filter(n => n._time >= 134 && n._time < 197);
filterednotes.forEach(note => {
  if (note._customData._fake != true) {
    note._customData._disableNoteGravity = true;
    note._customData._noteJumpMovementSpeed = 15;
    note._customData._noteJumpStartBeatOffset = 4;
	note._customData._animation = {}
	note._customData._animation._position = [[0,0,-20,0], [0,0,0,0.5, "easeOutSine"]]
    note._customData._animation._rotation = [[getRndInteger(-13,8), getRndInteger(-13,13), getRndInteger(-12,12), 0], [0, 0, 0, 0.475, "easeInOutQuad"]];
    note._customData._animation._localRotation = [[getRndInteger(-15,15), getRndInteger(-15,15), getRndInteger(-15,15), 0], [getRndInteger(-1.5,1.5), getRndInteger(-1,1), getRndInteger(-1,1), 0.5, "easeInOutBack"]];
	note._customData._animation._dissolve = [[0,0],[1,0.375, "easeOutQuad"]];
	note._customData._animation._scale = [[0.2,0.2,0.2,0], [1,1,1,0.375, "easeOutCubic"]];
	for (let index = 0; index < blurSamples*2; index++) {
		let n1 = JSON.parse(JSON.stringify(note));
		n1._time += (blurSpacing*0.01337)*(index*2)
		n1._customData._animation._dissolveArrow = [[0,0.2499],[0.45,0.25],[0,0.475 - (index*0.005), "easeInQuad"]];
		n1._customData._animation._dissolve = [[0,0.2499],[0.2,0.25],[0,0.475 - (index*0.005), "easeInOutQuad"]];
		n1._customData._animation._scale = [[0.25,0.25,0.25,0.25],[2,2,0.9,0.5 - (index*0.005), "easeInCubic"]];
    n1._customData._fake = true;
    n1._customData._interactable = false;
    n1._customData._disableNoteGravity = true;
    n1._customData._disableSpawnEffect = true;
    _notes.push(n1);
  }
}
}); 

filterednotes = _notes.filter(n => n._time >= 197 && n._time < 258);
filterednotes.forEach(note => {
  if (note._customData._fake != true) {
    note._customData._disableNoteGravity = true;
    note._customData._noteJumpMovementSpeed = 16;
    note._customData._noteJumpStartBeatOffset = 4;
	note._customData._animation = {}
    note._customData._animation._rotation = [[getRndInteger(-5,15), getRndInteger(-15,15), getRndInteger(-15,15), 0], [0, 0, 0, 0.475, "easeInOutCubic"]];
    note._customData._animation._localRotation = [[getRndInteger(-150,150), getRndInteger(-150,150), getRndInteger(-150,150), 0], [getRndInteger(-1,1), getRndInteger(-1,1), getRndInteger(-1,1), 0.475, "easeInOutBack"]];
	note._customData._animation._dissolve = [[0,0],[1,0.375, "easeOutQuad"]];
	note._customData._animation._scale = [[0.2,0.2,0.2,0], [1,1,1,0.375, "easeOutCubic"]];
  for (let index = 0; index < blurSamples*2; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
    n1._time += (blurSpacing*0.01337)*(index*2)
    n1._customData._animation._dissolveArrow = [[0,0.2499],[0.45,0.25],[0,0.475 - (index*0.005), "easeInQuad"]];
    n1._customData._animation._dissolve = [[0,0.2499],[0.2,0.25],[0,0.475 - (index*0.005), "easeInOutQuad"]];
    n1._customData._animation._scale = [[0.25,0.25,0.25,0.25],[2,2,0.9,0.5 - (index*0.005), "easeInCubic"]];
    n1._customData._fake = true;
    n1._customData._interactable = false;
    n1._customData._disableNoteGravity = true;
    n1._customData._disableSpawnEffect = true;
    _notes.push(n1);
  }
}
}); 

filterednotes = _notes.filter(n => n._time >= 258 && n._time <= 262);
filterednotes.forEach(note => {
  if (note._customData._fake != true) {
    note._customData._disableNoteGravity = true;
    note._customData._noteJumpMovementSpeed = 14;
    note._customData._noteJumpStartBeatOffset = 8;
	note._customData._animation = {}
    note._customData._animation._rotation = [[getRndInteger(-15,15), getRndInteger(-15,15), getRndInteger(-15,15), 0], [0, 0, 0, 0.475, "easeInOutCubic"]];
    note._customData._animation._localRotation = [[getRndInteger(-150,150), getRndInteger(-150,150), getRndInteger(-150,150), 0], [getRndInteger(-1,1), getRndInteger(-1,1), getRndInteger(-1,1), 0.475, "easeInOutBack"]];
	note._customData._animation._dissolve = [[0,0],[1,0.375, "easeOutQuad"]];
	note._customData._animation._scale = [[0.2,0.2,0.2,0], [1,1,1,0.375, "easeOutCubic"]];
  for (let index = 0; index < blurSamples*5; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
    n1._time += (blurSpacing*0.0169)*(index*2)
    n1._customData._animation._dissolveArrow = [[0,0.2499],[0.45,0.25],[0,0.475 - (index*0.005), "easeInQuad"]];
    n1._customData._animation._dissolve = [[0,0.2499],[0.2,0.25],[0,0.475 - (index*0.005), "easeInOutQuad"]];
    n1._customData._animation._scale = [[0.25,0.25,0.25,0.25],[3,3,0.9,0.5 - (index*0.005), "easeInCubic"]];
    n1._customData._fake = true;
    n1._customData._interactable = false;
    n1._customData._disableNoteGravity = true;
    n1._customData._disableSpawnEffect = true;
    _notes.push(n1);
  }
}
}); 


//#endregion





//#region Water 262-454
// first half
filterednotes = _notes.filter(n => n._time > 262 && n._time <= 325);
filterednotes.forEach(note => {
	if (note._customData._fake != true) {
    note._customData._track = "waterNotes";
    note._customData._noteJumpMovementSpeed = 10;
    note._customData._noteJumpStartBeatOffset = 18;
    note._customData._disableNoteGravity = true;
    note._customData._disableSpawnEffect = true;
    note._customData._animation = {}
    note._customData._animation._rotation = [[0,rnd(-4,4),0,0.375], [0,0,0,0.5, "easeInOutBack"]]
    note._customData._animation._localRotation = [[rnd(-45,45),rnd(-45,45),rnd(-45,45),0],[rnd(-45,45),rnd(-45,45),rnd(-45,45),0.375, "easeInOutBack"], [0,0,0,0.5, "easeInOutBack"]]
    if (note._lineLayer == 0) {
        note._customData._animation._position = [[rnd(-1.125,1.125),rnd(-0.65,-0.25),0,0.375], [0,0,0,0.5, "easeInOutBack"]]
        }
    if (note._lineLayer == 1) {
        note._customData._animation._position = [[rnd(-1.125,1.125),rnd(-1.35,-0.9),0,0.375], [0,0,0,0.5, "easeInOutBack"]]
    }
    if (note._lineLayer == 2) {
        note._customData._animation._position = [[rnd(-1.125,1.125),rnd(-2.25,-1.75),0,0.375], [0,0,0,0.5, "easeInOutBack"]]
        }
    for (let index = 0; index < 1; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
        n1._time -= 0.0125
        n1._customData._track = "waterNotesF";
        n1._customData._noteJumpMovementSpeed = 4;
        n1._customData._noteJumpStartBeatOffset = 8;
        n1._customData._fake = true;
        n1._customData._interactable = false;
        n1._customData._disableSpawnEffect = true;
        n1._customData._disableNoteGravity = true;
        n1._customData._color = [2,2,2,2];
        n1._customData._animation = {}
        if (n1._lineLayer != 0) {
            n1._lineLayer = 0;
            n1._customData._animation._dissolve = [[0.25,0.125], [0,0.375,"easeInOutCubic"]];
            n1._customData._animation._position = [[0,-1,20,0], [0,-2.5,20,0.5, "easeOutQuad"]];
        }
        n1._customData._animation._position = [[0,-0.69,20,0.25], [0,-1.5,15,0.5, "easeOutSine"]];
        n1._customData._animation._dissolveArrow = [[0,0]];
        n1._customData._animation._dissolve = [[0,0.25],[0.420,0.375, "easeInOutQuad"], [0,0.675,"easeInOutBounce"]];
        n1._customData._animation._scale = [[1.2,0.01,3,0.125], [10,0.01,50,0.6, "easeInExpo"]];
        _notes.push(n1);

    }
}
});

// slider section 1
filterednotes = _notes.filter(n => n._time > 325 && n._time <= 400);
filterednotes.forEach(note => {
    note._customData._track = "waterNotes";
    note._customData._noteJumpMovementSpeed = 12;
    note._customData._noteJumpStartBeatOffset = 16;
    note._customData._disableNoteGravity = true;
    note._customData._disableSpawnEffect = true;
    note._customData._animation = {}
    note._customData._animation._dissolve = [[rnd(0.35,0.69),0.125], [1,0.5, "easeInOutBack"]];
    if (note._cutDirection == 8) {
        note._customData._animation._dissolveArrow = [[0.25,0.125], [rnd(0.25,0.4),0.55,"easeInOutCubic"]]; 
    }
    if (note._cutDirection != 8) {
        note._customData._animation._dissolveArrow = [[0.25,0.125], [rnd(0.69,0.9),0.55,"easeInOutCubic"]];
    }
    note._customData._animation._rotation = [[0,rnd(-3,3),0,0.25], [0,0,0,0.5, "easeInOutCubic"]]
    note._customData._animation._localRotation = [[rnd(-45,45),rnd(-45,45),rnd(-45,45),0],[rnd(-45,45),rnd(-45,45),rnd(-45,45),0.2, "easeInOutBack"], [0,0,0,0.5, "easeInOutBack"]]
    if (note._lineLayer == 0) {
        note._customData._animation._position = [[rnd(-15.5,15.5),rnd(-0.75,-0.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
    if (note._lineLayer == 1) {
    note._customData._animation._position = [[rnd(-15.5,15.5),rnd(-1.45,-0.95),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
    }
    if (note._lineLayer == 2) {
        note._customData._animation._position = [[rnd(-15.5,15.5),(-2.75,-2.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
    
    for (let index = 0; index < 1; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
        n1._time -= 0.01337
        n1._customData._track = "waterNotesF";
        n1._customData._noteJumpMovementSpeed = 4;
        n1._customData._noteJumpStartBeatOffset = 8;
        n1._customData._fake = true;
        n1._customData._interactable = false;
        n1._customData._disableSpawnEffect = true;
        n1._customData._disableNoteGravity = true;
        n1._customData._color = [2,2,2,2];
        n1._customData._animation = {}
        if (n1._lineLayer == 0) {
            n1._customData._animation._position = [[0,-0.69,20,0.25], [0,-2.25,10,0.675, "easeOutSine"]];
            n1._customData._animation._dissolveArrow = [[0,0]];
            n1._customData._animation._dissolve = [[0,0.25],[0.420,0.375, "easeInOutQuad"], [0,0.675,"easeInOutBounce"]];
            n1._customData._animation._scale = [[1.2,0.01,3,0.125], [15,0.01,50,0.6, "easeInExpo"]];
			_notes.push(n1);
        }
        if (n1._lineLayer != 0) {
            n1._lineLayer = 0;
            n1._customData._animation._position = [[0,-1,20,0.25], [0,-2,15,0.5, "easeOutQuad"]];
            n1._customData._animation._dissolveArrow = [[0,0]];
            n1._customData._animation._dissolve = [[0,0.25],[0.15,0.375, "easeInQuad"], [0,0.675,"easeInOutBounce"]];
            n1._customData._animation._scale = [[20,0.01,6.9,0.125], [75,0.01,55,0.675, "easeInExpo"]];
        }

    }
});
// slider section 2
filterednotes = _notes.filter(n => n._time > 400 && n._time <= 438);
filterednotes.forEach(note => {
    note._customData._track = "waterNotes";
    note._customData._noteJumpMovementSpeed = 12;
    note._customData._noteJumpStartBeatOffset = 10;
    note._customData._disableNoteGravity = true;
    note._customData._disableSpawnEffect = true;
    note._customData._animation = {}
    note._customData._animation._dissolve = [[rnd(0.35,0.69),0.125], [1,0.5, "easeInOutBack"]];
    if (note._cutDirection == 8) {
        note._customData._animation._dissolveArrow = [[0.25,0.125], [rnd(0.25,0.4),0.55,"easeInOutCubic"]]; 
    }
    if (note._cutDirection != 8) {
        note._customData._animation._dissolveArrow = [[0.25,0.125], [rnd(0.69,0.9),0.55,"easeInOutCubic"]];
    }
    note._customData._animation._rotation = [[0,rnd(-3,3),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
    note._customData._animation._localRotation = [[rnd(-45,45),rnd(-45,45),rnd(-45,45),0],[rnd(-45,45),rnd(-45,45),rnd(-45,45),0.2, "easeInOutBack"], [0,0,0,0.5, "easeInOutBack"]]
    if (note._lineLayer == 0) {
        if (note._type == 0) {
            note._customData._animation._position = [[rnd(-10,17.38),rnd(-0.75,-0.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
        if (note._type == 1) {
        note._customData._animation._position = [[rnd(-9,42.0),rnd(-0.75,-0.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
    }
    if (note._lineLayer == 1) {
        if (note._type == 0) {
            note._customData._animation._position = [[rnd(-9,13.37),rnd(-1.45,-0.95),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
        if (note._type == 1) {
            note._customData._animation._position = [[rnd(-10,42.0),rnd(-1.45,-0.95),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
    }   
    if (note._lineLayer == 2) {
        if (note._type == 0) {
            note._customData._animation._position = [[rnd(-8,6.9),(-2.75,-2.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
        if (note._type == 1) {
            note._customData._animation._position = [[rnd(-11,42.0),(-2.75,-2.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
    }
    for (let index = 0; index < 1; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
        n1._time -= 0.01337
        n1._customData._track = "waterNotesF";
        n1._customData._noteJumpMovementSpeed = 4;
        n1._customData._noteJumpStartBeatOffset = 8;
        n1._customData._fake = true;
        n1._customData._interactable = false;
        n1._customData._disableSpawnEffect = true;
        n1._customData._disableNoteGravity = true;
        n1._customData._color = [2,2,2,2];
        n1._customData._animation = {}
        if (n1._lineLayer == 0) {
            n1._customData._animation._position = [[0,-0.69,20,0.25], [0,-2.25,10,0.675, "easeOutSine"]];
            n1._customData._animation._dissolveArrow = [[0,0]];
            n1._customData._animation._dissolve = [[0,0.25],[0.420,0.375, "easeInOutQuad"], [0,0.675,"easeInOutBounce"]];
            n1._customData._animation._scale = [[1.2,0.01,3,0.125], [15,0.01,50,0.6, "easeInExpo"]];
			_notes.push(n1);
        }
        if (n1._lineLayer != 0) {
            n1._lineLayer = 0;
            n1._customData._animation._position = [[0,-1,20,0.25], [0,-2,15,0.5, "easeOutQuad"]];
            n1._customData._animation._dissolveArrow = [[0,0]];
            n1._customData._animation._dissolve = [[0,0.25],[0.15,0.375, "easeInQuad"], [0,0.675,"easeInOutBounce"]];
            n1._customData._animation._scale = [[20,0.01,6.9,0.125], [75,0.01,55,0.675, "easeInExpo"]];;
        }

    }
});
// slider section 3
filterednotes = _notes.filter(n => n._time > 438 && n._time <= 454);
filterednotes.forEach(note => {
    note._customData._track = "waterNotes";
    note._customData._noteJumpMovementSpeed = 12;
    note._customData._noteJumpStartBeatOffset = 8;
    note._customData._disableNoteGravity = true;
    note._customData._disableSpawnEffect = true;
    note._customData._animation = {}
    note._customData._animation._dissolve = [[rnd(0.35,0.69),0.125], [1,0.5, "easeInOutBack"]];
    if (note._cutDirection == 8) {
        note._customData._animation._dissolveArrow = [[0.25,0.125], [rnd(0.25,0.4),0.55,"easeInOutCubic"]]; 
    }
    if (note._cutDirection != 8) {
        note._customData._animation._dissolveArrow = [[0.25,0.125], [rnd(0.69,0.9),0.55,"easeInOutCubic"]];
    }
    note._customData._animation._rotation = [[0,rnd(-3,3),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
    note._customData._animation._localRotation = [[rnd(-45,45),rnd(-45,45),rnd(-45,45),0],[rnd(-45,45),rnd(-45,45),rnd(-45,45),0.2, "easeInOutBack"], [0,0,0,0.5, "easeInOutBack"]]
    if (note._lineLayer == 0) {
        note._customData._animation._position = [[rnd(-17.38,17.38),rnd(-0.75,-0.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
    if (note._lineLayer == 1) {
    note._customData._animation._position = [[rnd(-17.38,17.38),rnd(-1.45,-0.95),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
    }
    if (note._lineLayer == 2) {
        note._customData._animation._position = [[rnd(-17.38,17.38),(-2.75,-2.45),0,0.25], [0,0,0,0.5, "easeInOutExpo"]]
        }
    
    for (let index = 0; index < 1; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
        n1._time -= 0.01337
        n1._customData._track = "waterNotesF";
        n1._customData._noteJumpMovementSpeed = 4;
        n1._customData._noteJumpStartBeatOffset = 8;
        n1._customData._fake = true;
        n1._customData._interactable = false;
        n1._customData._disableSpawnEffect = true;
        n1._customData._disableNoteGravity = true;
        n1._customData._color = [2,2,2,2];
        n1._customData._animation = {}
        if (n1._lineLayer == 0) {
            n1._customData._animation._position = [[0,-0.69,20,0.25], [0,-2.25,10,0.675, "easeOutSine"]];
            n1._customData._animation._dissolveArrow = [[0,0]];
            n1._customData._animation._dissolve = [[0,0.25],[0.420,0.375, "easeInOutQuad"], [0,0.675,"easeInOutBounce"]];
            n1._customData._animation._scale = [[1.2,0.01,3,0.125], [15,0.01,50,0.6, "easeInExpo"]];
			_notes.push(n1);
        }
        if (n1._lineLayer != 0) {
            n1._lineLayer = 0;
            n1._customData._animation._position = [[0,-1,20,0.25], [0,-2,15,0.5, "easeOutQuad"]];
            n1._customData._animation._dissolveArrow = [[0,0]];
            n1._customData._animation._dissolve = [[0,0.25],[0.15,0.375, "easeInQuad"], [0,0.675,"easeInOutBounce"]];
            n1._customData._animation._scale = [[20,0.01,6.9,0.125], [75,0.01,55,0.675, "easeInExpo"]];
        }

    }
});

_customEvents.push({
    _time: 454,
    _type: "AnimateTrack",
    _data: {
      _track: "waterNotesF",
      _duration: 4,
      _dissolve: [[0.25, 0], [0, 1, "easeOutExpo"]],
      _dissolveArrow: [[0, 0]]
    }
  }); 



//#endregion

//#region Mountain Section 454-517
  filterednotes = _notes.filter(n => n._time > 454 && n._time <= 517);
  filterednotes.forEach(note => {
    if (note._cutDirection != 8) {note._customData._track = "mtnNotes";}
    if (note._cutDirection == 8) {note._customData._track = "mtnNotesD";}
    note._customData._noteJumpMovementSpeed = 12;
    note._customData._noteJumpStartBeatOffset = 20;
    note._customData._disableSpawnEffect = true;
    note._customData._disableNoteGravity = true;
    note._customData._animation = {}
	note._customData._animation._dissolve = [[0,0], [1,0.125,"easeOutSine"]]
    note._customData._animation._position = [[0,0,-95,0], [0,0,0,0.5, "easeInOutQuad"]];
    note._customData._animation._rotation = [[rnd(-90,50), rnd(-69,90), rnd(-80,80), 0],[rnd(-3,3),rnd(-10,10),rnd(-2,2),0.5,"easeOutBack"]]; 
    note._customData._animation._localRotation = [[rnd(-90,90), rnd(-90,90), rnd(-90,90), 0],[rnd(-180,180), rnd(-180,180), rnd(-180,180), 0.25, "easeOutBack"],[0,0,0,0.5,"easeOutBack"]]; 
    for (let index = 0; index < 1; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
        n1._time += 6.66
        n1._customData._track = "birbs";
        n1._customData._noteJumpMovementSpeed = 4;
        n1._customData._noteJumpStartBeatOffset = 20;
        n1._customData._fake = true;
        n1._customData._interactable = false;
        n1._customData._disableSpawnEffect = true;
        n1._customData._disableNoteGravity = true;
        n1._customData._color = [1,1,1,1];
        n1._customData._animation = {}
            n1._customData._animation._position = [[rnd(-25,12), rnd(55,69), rnd(6.9,69), 0], [rnd(-40,0), rnd(42.0,55), rnd(-69,-6.9), 1, "easeInOutQuint"]]; 
            n1._customData._animation._rotation = [[10, rnd(-10,10), 0, 0]]; 
            n1._customData._animation._dissolve = [[0,0]];
            n1._customData._animation._scale = [[4.20,2.2,1,0]];
            if (n1._cutDirection != 8) {
            _notes.push(n1);
            }
        }
}); 

  _customEvents.push({
    _time: 6.66,
    _type: "AnimateTrack",
    _data: {
      _track: "waterNotes",
      _duration: 0,
      _dissolve: [[0, 0]],
      _dissolveArrow: [[0, 0]]
    }
  }, {
    _time: 262,
    _type: "AnimateTrack",
    _data: {
      _track: "waterNotes",
      _duration: 5,
      _dissolve: [[0, 0], [1, 1, "easeOutExpo"]],
      _dissolveArrow: [[0, 0], [1, 0.5, "easeInCubic"]]
    }
  }); 

  _customEvents.push({
    _time: 420.69,
    _type: "AnimateTrack",
    _data: {
      _track: "mtnNotes",
      _duration: 0,
      _dissolve: [[0, 0]],
      _dissolveArrow: [[0, 0]]
    }
  }, {
    _time: 454,
    _type: "AnimateTrack",
    _data: {
      _track: "mtnNotes",
      _duration: 4,
      _dissolve: [[0, 0], [rnd(0.666,0.85), 1, "easeOutExpo"]],
      _dissolveArrow: [[0, 0], [rnd(0.666,0.85), 0.25, "easeInOutCubic"]]
    }
  });  

  _customEvents.push({
    _time: 420.69,
    _type: "AnimateTrack",
    _data: {
      _track: "mtnNotesD",
      _duration: 0,
      _dissolve: [[0, 0]],
      _dissolveArrow: [[0, 0]]
    }
  }, {
    _time: 454,
    _type: "AnimateTrack",
    _data: {
      _track: "mtnNotesD",
      _duration: 4,
      _dissolve: [[0, 0], [rnd(0.666,0.85), 1, "easeOutExpo"]],
      _dissolveArrow: [[0, 0], [rnd(0.666,0.85), 0.25, "easeInOutCubic"]]
    }
  });  


  map._customData._environment.push({
    _id: "Environment\\.\\[\\d+\\]CoreLighting.\\[3\\]DirectionalLight$",
    _lookupMethod: "Regex",
    _track: "MountainLight",
    _active: true
  });
    _customEvents.push({
        _time: 0,
        _type: "AnimateTrack",
        _data: {
          _track: "MountainLight",
          _duration: 0,
          _localRotation: [[7, 180, 180, 0]], 
      
        }
    },{
        _time: 454,
        _type: "AnimateTrack",
        _data: {
          _track: "MountainLight",
          _duration: 518-454,
          _localRotation: [[18, 181, 180, 0], [2, 355, 180, 1, "easeInExpo"]],     
        }
    });

//#endregion

//#region Flying rectangle things 518-580

filterednotes = _notes.filter(n => n._time > 518 && n._time <= 580);
filterednotes.forEach(note => {
    if (note._customData._track != "birbs") {
    note._customData._track = "flyingNotes"
    note._customData._noteJumpMovementSpeed = 19;
    note._customData._noteJumpStartBeatOffset = 2;
    note._customData._disableSpawnEffect = true;
    note._customData._disableNoteGravity = true;
    note._customData._animation = {}
    note._customData._animation._position = [[rnd(-8,8),rnd(-8,8),-18,0.125], [0,0,0,0.375, "easeInOutCirc"]];
    note._customData._animation._localRotation = [[rnd(-90,90), rnd(-169,69), rnd(-90,90), 0.125],[0,0,0,0.375,"easeInOutCirc"]];
    }
});

_customEvents.push({
    _time: 548,
    _type: "AnimateTrack",
    _data: {
      _track: "flyingNotes",
      _duration: 2,
      _dissolve: [[1, 0, "splineCatmullRom"],[0.2, 0.5, "splineCatmullRom"], [1, 1, "splineCatmullRom", "easeOutExpo"]],
      _dissolveArrow: [[0, 0], [1, 1, "easeInOutBounce"]]
    }
}); 
_customEvents.push( {
    _time: 550,
    _type: "AnimateTrack",
    _data: {
      _track: "flyingNotes",
      _duration: 581-550,
      _dissolve: [[0.9, 0], [0.666, 1, "easeInQuad"]],
      _dissolveArrow: [[1, 0], [0.69, 1, "easeInCubic"]]
    }
}); 




//#endregion
//#region Tree 581 - 646

function treeRot (beat,angle, mult, side) {
filterednotes = _notes.filter(n => n._time >= beat && n._time <= beat+1); 
filterednotes.forEach(note => { 
for (let i = 0; i <= 4; i++) { 
    //note._customData._animation = {}
    if (side == 2) {    
    if (note._lineIndex == 0) {
        note._customData._animation._rotation = [[0,0,0,0], [0,(angle*0.5)-(i*mult),0,0.4375, "easeOutExpo"]];
    }
    if (note._lineIndex == 1) {
        note._customData._animation._rotation = [[0,0,0,0], [0,(angle*0.65)-(i*mult),0,0.4375, "easeOutExpo"]];
    }
    if (note._lineIndex == 2) {
        note._customData._animation._rotation = [[0,0,0,0], [0,(angle*0.8)-(i*mult),0,0.4375, "easeOutExpo"]];
    }
    if (note._lineIndex == 3) {
        note._customData._animation._rotation = [[0,0,0,0], [0,(angle)-(i*mult),0,0.4375, "easeOutExpo"]];
    }
}
if (side == 1) {    
    if (note._lineIndex == 3) {
        note._customData._animation._rotation = [[0,0,0,0], [0,-(angle*0.5)+(i*mult),0,0.4375, "easeOutExpo"]];
    }
    if (note._lineIndex == 2) {

        note._customData._animation._rotation = [[0,0,0,0], [0,-(angle*0.65)+(i*mult),0,0.4375, "easeOutExpo"]];
    }
    if (note._lineIndex == 1) {
        note._customData._animation._rotation = [[0,0,0,0], [0,-(angle*0.8)+(i*mult),0,0.4375, "easeOutExpo"]];
    }
    if (note._lineIndex == 0) {
        note._customData._animation._rotation = [[0,0,0,0], [0,-(angle)+(i*mult),0,0.4375, "easeOutExpo"]];
    }
}
}
}); 
}
filterednotes = _notes.filter(n => n._time >= 581 && n._time < 614); 
filterednotes.forEach(note => { 
  note._customData._noteJumpStartBeatOffset = 2;
  note._customData._noteJumpMovementSpeed = 16;
  note._customData._disableSpawnEffect = true;
  note._customData._disableNoteGravity = true;
  note._customData._animation = {}
  note._customData._animation._dissolve = [[0,0], [0.87,0.125, "easeOutExpo"], [0.92,0.55, "easeOutSine"]];
  note._customData._animation._dissolveArrow = [[0,0], [0.85,0.125, "easeOutExpo"], [0.8,0.5, "easeOutSine"]];
  note._customData._animation._scale = [[0.01,0.01,1,0], [1,1,1,0.125, "easeOutCubic"]];
  if (note._lineIndex == 0) {
    note._customData._animation._position = [[1.5,rnd(-3,-1),-5,0], [0,0,0,0.5, "easeOutExpo"]];
}
if (note._lineIndex == 1) {
    note._customData._animation._position = [[0.5,rnd(-3,-1),-5,0], [0,0,0,0.5, "easeOutExpo"]];
}
if (note._lineIndex == 2) {
    note._customData._animation._position = [[-0.5,rnd(-3,-1),-5,0], [0,0,0,0.5, "easeOutExpo"]];
}
if (note._lineIndex == 3) {
    note._customData._animation._position = [[-1.5,rnd(-3,-1),-5,0], [0,0,0,0.5, "easeOutExpo"]];
} 
}); 
// SWIFTER CHANGE NJS HERE
// 17.5 = 17
// 19 = 18
filterednotes = _notes.filter(n => n._time >= 614 && n._time < 678); 
filterednotes.forEach(note => { 
  note._customData._noteJumpStartBeatOffset = 2;
  note._customData._noteJumpMovementSpeed = 17.5;
  note._customData._disableSpawnEffect = true;
  note._customData._disableNoteGravity = true;
  note._customData._animation = {}
  note._customData._animation._dissolve = [[0,0], [0.86,0.25, "easeOutExpo"], [0.91,0.5, "easeOutSine"]];
  note._customData._animation._dissolveArrow = [[0,0], [0.85,0.125, "easeOutExpo"], [0.9,0.5, "easeOutSine"]];
  note._customData._animation._scale = [[0.01,0.01,1,0], [1,1,1,0.25, "easeOutCubic"]];
  if (note._lineIndex == 0) {
    note._customData._animation._position = [[1.5,rnd(-4.20,4.20),-7,0], [0,0,0,0.475, "easeOutQuint"]];
}
if (note._lineIndex == 1) {
    note._customData._animation._position = [[0.5,rnd(-4.20,4.20),-7,0], [0,0,0,0.475, "easeOutQuint"]];
}
if (note._lineIndex == 2) {
    note._customData._animation._position = [[-0.5,rnd(-4.20,4.20),-7,0], [0,0,0,0.475, "easeOutQuint"]];
}
if (note._lineIndex == 3) {
    note._customData._animation._position = [[-1.5,rnd(-4.20,4.20),-7,0], [0,0,0,0.475, "easeOutQuint"]];
} 
}); 


filterednotes = _notes.filter(n => n._time >= 678 && n._time < 711); 
filterednotes.forEach(note => { 
  note._customData._noteJumpStartBeatOffset = 2;
  note._customData._noteJumpMovementSpeed = 19;
  note._customData._disableSpawnEffect = true;
  note._customData._disableNoteGravity = true;
  note._customData._animation = {}
  note._customData._animation._dissolve = [[0,0], [0.85,0.25, "easeOutExpo"], [0.9,0.5, "easeOutSine"]];
  note._customData._animation._dissolveArrow = [[0,0], [0.8,0.125, "easeOutExpo"], [0.85,0.5, "easeOutSine"]];
  note._customData._animation._scale = [[0.01,0.01,1,0], [1,1,1,0.25, "easeOutCubic"]];
  if (note._lineIndex == 0) {
    note._customData._animation._position = [[1.5,rnd(-10,10),-10,0], [0,0,0,0.475, "easeOutExpo"]];
}
if (note._lineIndex == 1) {
    note._customData._animation._position = [[0.5,rnd(-10,10),-10,0], [0,0,0,0.475, "easeOutExpo"]];
}
if (note._lineIndex == 2) {
    note._customData._animation._position = [[-0.5,rnd(-10,10),-10,0], [0,0,0,0.475, "easeOutExpo"]];
}
if (note._lineIndex == 3) {
    note._customData._animation._position = [[-1.5,rnd(-10,10),-10,0], [0,0,0,0.475, "easeOutExpo"]];
} 
}); 


let angle = 10
let multiplier = 1

treeRot(582.0, angle, multiplier, 2)
treeRot(583.5, angle, multiplier, 1)
treeRot(585.0, angle, multiplier, 2)
treeRot(586.5, angle, multiplier, 1)
treeRot(590.0, angle, multiplier, 2)
treeRot(591.5, angle, multiplier, 1)
treeRot(593.0, angle, multiplier, 2)
treeRot(594.5, angle, multiplier, 1)
treeRot(598.0, angle, multiplier, 2)
treeRot(599.5, angle, multiplier, 1)
treeRot(601.0, angle, multiplier, 2)
treeRot(602.5, angle, multiplier, 1)

treeRot(606.0, 10.0, multiplier, 1)
treeRot(607.5, 10.0, multiplier, 2)
treeRot(609.0, 20.0, multiplier, 2)
treeRot(610.5, 10.0, multiplier, 2)
treeRot(612.0, 13.5, multiplier, 1)
treeRot(613.0, 6.90, multiplier, 2)

treeRot(614.0, angle, multiplier, 1)
treeRot(615.5, angle, multiplier, 2)
treeRot(617.0, angle, multiplier, 1)
treeRot(618.5, angle, multiplier, 2)
treeRot(620.0, angle, multiplier, 1)
treeRot(621, angle/2, multiplier, 1)
treeRot(622.0, angle, multiplier, 1)
treeRot(623.5, angle, multiplier, 2)
treeRot(625.0, angle, multiplier, 1)
treeRot(626.5, angle, multiplier, 2)
treeRot(628.0, angle, multiplier, 1)
treeRot(629, angle/2, multiplier, 1)
treeRot(630.0, angle, multiplier, 1)
treeRot(631.5, angle, multiplier, 2)
treeRot(630.0, angle, multiplier, 1)
treeRot(631.5, angle, multiplier, 2)
treeRot(633.0, angle, multiplier, 1)
treeRot(634.5, angle, multiplier, 2)
treeRot(636.0, angle, multiplier, 1)
treeRot(637, angle/2, multiplier, 1)

treeRot(638.0, 10.0, multiplier, 2)
treeRot(639.5, 10.0, multiplier, 1)
treeRot(641.0, 20.0, multiplier, 1)
treeRot(642.5, 10.0, multiplier, 1)
treeRot(644.0, 13.5, multiplier, 2)
treeRot(645.0, 6.90, multiplier, 1)

function lmaoFuckThisShitR(time, angle, multiplier) {
    treeRot(time, angle, multiplier, 2)
    treeRot(time+1.5, angle, multiplier, 1)
    treeRot(time+3, angle, multiplier, 2)
    treeRot(time+4.5, angle, multiplier, 1)
}
function lmaoFuckThisShitL(time, angle, multiplier) {
    treeRot(time, angle, multiplier, 1)
    treeRot(time+1.5, angle, multiplier, 2)
    treeRot(time+3, angle, multiplier, 1)
    treeRot(time+4.5, angle, multiplier, 2)
}
lmaoFuckThisShitL(646, 8, 1)
lmaoFuckThisShitL(654, 8, 1)
lmaoFuckThisShitL(662, 8, 1)
lmaoFuckThisShitL(662, 8, 1)

treeRot(670.0, 10.0, 1, 2)
treeRot(671.5, 15.0, 1, 1)
treeRot(673.0, 20.0, 1, 1)
treeRot(674.0, 15.0, 1, 1)

lmaoFuckThisShitR(678, 6.9, 1)
lmaoFuckThisShitR(686, 6.9, 1)
lmaoFuckThisShitR(694, 6.9, 1)

treeRot(702.0, 23.0, 1, 2)
treeRot(703.5, 21.0, 1, 1)
treeRot(705.0, 15.0, 1, 2)
treeRot(706.0, 10.0, 1, 1)







filterednotes = _notes.filter(n => n._time > 717 && n._time <= 808);
filterednotes.forEach(note => {
    note._customData._track = "waterNotes2";
    note._customData._noteJumpMovementSpeed = 8;
    note._customData._noteJumpStartBeatOffset = 10;
    note._customData._disableNoteGravity = true;
    note._customData._disableSpawnEffect = true;
    note._customData._animation = {}
    if (note._cutDirection == 8) {
        note._customData._animation._dissolveArrow = [[0.1,0]]; 
    }
    note._customData._animation._rotation = [[0,rnd(-4,4),0,0.25], [0,0,0,0.5, "easeInOutBack"]]
    note._customData._animation._localRotation = [[rnd(-45,45),rnd(-45,45),rnd(-45,45),0],[rnd(-45,45),rnd(-45,45),rnd(-45,45),0.23, "easeInOutBack"], [0,0,0,0.5, "easeInOutBack"]]
    if (note._lineLayer == 0) {
        note._customData._animation._position = [[rnd(-1.125,1.125),rnd(-0.65,-0.25),0,0.25], [0,0,0,0.5, "easeInOutBack"]]
        }
    if (note._lineLayer == 1) {
        note._customData._animation._position = [[rnd(-1.125,1.125),rnd(-1.35,-0.9),0,0.25], [0,0,0,0.5, "easeInOutBack"]]
    }
    if (note._lineLayer == 2) {
        note._customData._animation._position = [[rnd(-1.125,1.125),rnd(-2.25,-1.75),0,0.25], [0,0,0,0.5, "easeInOutCubic"]]
        }
    for (let index = 0; index < 1; index++) {
    let n1 = JSON.parse(JSON.stringify(note));
        n1._time -= 0.0125
        n1._customData._track = "waterNotesF2";
        n1._customData._noteJumpMovementSpeed = 2;
        n1._customData._noteJumpStartBeatOffset = 8;
        n1._customData._fake = true;
        n1._customData._interactable = false;
        n1._customData._disableSpawnEffect = true;
        n1._customData._disableNoteGravity = true;
        n1._customData._color = [0.5,0.5,0.5,0.5];
        n1._customData._animation = {}
        if (n1._lineLayer != 0) {
            n1._lineLayer = 0;
            n1._customData._animation._dissolve = [[0.2,0.125], [0,0.375,"easeOutCubic"]];
            n1._customData._animation._position = [[0,-1,20,0], [0,-2.5,25,0.5, "easeOutQuad"]];
        }
        n1._customData._animation._position = [[0,-1,20,0.25], [0,-2,15,0.5, "easeOutSine"]];
        n1._customData._animation._dissolveArrow = [[0,0]];
        n1._customData._animation._dissolve = [[0,0.25],[0.35,0.375, "easeInOutQuad"], [0,0.675,"easeInOutBounce"]];
        n1._customData._animation._scale = [[1.2,0.01,3,0.125], [10,0.01,50,0.6, "easeInExpo"]];
        _notes.push(n1);

    }
});

_customEvents.push({
    _time: 666,
    _type: "AnimateTrack",
    _data: {
      _track: "waterNotes2",
      _duration: 0,
      _dissolve: [[0, 0]],
      _dissolveArrow: [[0, 0]]
    }
  }, {
    _time: 710,
    _type: "AnimateTrack",
    _data: {
      _track: "waterNotes2",
      _duration: 4,
      _dissolve: [[0, 0], [1, 1, "easeOutExpo"]],
      _dissolveArrow: [[0, 0], [1, 0.5, "easeInCubic"]]
    }
  }); 






  // THE GLUE
  _customEvents.push({
    _time: 0.420666,
    _type: "AssignTrackParent",
    _data: {
    _childrenTracks: ["waterNotes2","waterNotesF2","mtnNotes", "mtnNotesD", "waterNotes", "waterNotesF", "allTunnelTrackPush", "flyingNotes"], 
    _parentTrack: "noteChild" 
    }
  });
//#endregion
//#endregion

// REDDEK CODE
//#region
const EL = "easeLinear";
const HJD = 1.6;
const TWO_PI = 2 * Math.PI;
// const permOffset = [0,200,0];
const tracks = [];

// let filterednotes;
let filteredobs;

let tog;
let tog2;

// let _pointDefinitions = map._customData._pointDefinitions;

function add3(arr1, arr2) {
    arr1[0] += arr2[0];
    arr1[1] += arr2[1];
    arr1[2] += arr2[2];
    return arr1;
}

function DisIn(track, time) {
	_customEvents.push({
		_time: time - HJD,
		_type: "AnimateTrack",
		_data: {
			_track: track,
			_duration: HJD * 2,
			_dissolve: [[0, 0.499], [1, 1]]
		}
	})
}

function DisInS(track, time, dur, when) {
	_customEvents.push({
		_time: time - (dur / 2),
		_type: "AnimateTrack",
		_data: {
			_track: track,
			_duration: dur,
			_dissolve: [[0, 0.499], [1, when]]
		}
	})
}

function DisOut(track, time) {
	_customEvents.push({
		_time: time - HJD,
		_type: "AnimateTrack",
		_data: {
			_track: track,
			_duration: HJD,
			_dissolve: [[1, 0], [0, 1]]
		}
	})
}

function Circ(trackN, startBeat, dur, radius, amount, h, l, xPos, yPos, zPos, rots, disTime, color) {
	for (let i = 0; i < amount; i++) {
		let angle = Math.PI * 2 / amount;
		let rot = 360 / amount * i;
		let radians = angle * i
		let w = 2 * radius * Math.tan(Math.PI / amount);
		let sx = xPos + Math.cos(radians) * radius - w / 2;
		let sy = yPos + Math.sin(radians) * radius - h / 2;
		_obstacles.push({
			_time: (startBeat + HJD)+0.05*i,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData: {
				_interactable: false,
				_track: trackN,
				_scale: [w, h, l],
				_rotation: [0, 0, 0],
				_localRotation: [0, 0, 90 + rot],
				_position: [sx, sy, 0],
				_animation: {
					_definitePosition: [[0, 0, zPos, 0]],
					_color: (color) ? color : [[1, 1, 1, 1, 0]]
				}
			}
		})
	}
	if (rots > 0) {
		_customEvents.push({
			_time: startBeat - 2,
			_type: "AnimateTrack",
			_data: {
				_track: trackN,
				_duration: dur + 2,
				_rotation: [[0, 0, 0 + rots, 0]],
			}
		})
	}
	if (disTime > 0) {
		_customEvents.push({
			_time: disTime,
			_type: "AnimateTrack",
			_data: {
				_track: trackN,
				_duration: 1,
				_dissolve: [[1, 0], [0, 0.95]]
			}
		})
	}

}

function CircRots(trackN, startBeat, dur, radius, amount, h, l, xPos, yPos, zPos, rotX, rotY, rotZ, disTime, color) {
	for (let i = 0; i < amount; i++) {
		let angle = Math.PI * 2 / amount;
		let rot = 360 / amount * i;
		let radians = angle * i
		let w = 2 * radius * Math.tan(Math.PI / amount);
		let sx = xPos + Math.cos(radians) * radius - (w / 2);
		let sy = yPos + Math.sin(radians) * radius - (h / 2);
		_obstacles.push({
			_time: startBeat + HJD,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData: {
				_interactable: false,
				_track: trackN,
				_scale: [w, h, l],
				_rotation: [0, 0, 0],
				_localRotation: [0, 0, 90 + rot],
				_position: [sx, sy, 0],
				_animation: {
					_definitePosition: [[0, 0, zPos, 0]],
					_color: (color) ? color : [[1, 1, 1, 1, 0]]
				}
			}
		})
	}

	_customEvents.push({
		_time: 0,
		_type: "AnimateTrack",
		_data: {
			_track: trackN,
			_rotation: [rotX, rotY, rotZ],
		}
	})

	if (disTime > 0) {
		_customEvents.push({
			_time: disTime,
			_type: "AnimateTrack",
			_data: {
				_track: trackN,
				_duration: 1,
				_dissolve: [[1, 0], [0, 0.95]]
			}
		})
	}

}

function CircMove(trackN, startBeat, dur, radius, amount, h, l, xPos, yPos, zPos, rot, color, NJSO, NJS) {
	for (let i = 0; i < amount; i++) {
		let angle = Math.PI * 2 / amount;
		let rot = 360 / amount * i;
		let radians = angle * i
		let w = 2 * radius * Math.tan(Math.PI / amount);
		let sx = xPos + Math.cos(radians) * radius - w / 2;
		let sy = yPos + Math.sin(radians) * radius - h / 2;
		_obstacles.push({
			_time: startBeat,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData: {
				_noteJumpStartBeatOffset: NJSO,
				_noteJumpMovementSpeed: NJS,
				_interactable: false,
				_track: trackN,
				_scale: [w, h, l],
				_rotation: [0, 0, 0],
				_localRotation: [0, 0, 90 + rot],
				_position: [sx, sy, zPos],
				_animation: {
					_color: (color) ? color : [[1, 1, 1, 1, 0]]
				}
			}
		})
	}
	_customEvents.push({
		_time: startBeat - 2,
		_type: "AnimateTrack",
		_data: {
			_track: trackN,
			_duration: dur + 2,
			_rotation: [[0, 0, 0 + rot, 1]]
		}
	})

}

function randomSpherePoint(x0, y0, z0, radius) {
	var u = Math.random();
	var v = Math.random();
	var theta = 2 * Math.PI * u;
	var phi = Math.acos(2 * v - 1);
	var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
	var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
	var z = z0 + (radius * Math.cos(phi));
	return [x, y, z];
}

function getRndInteger(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRotdir() {
	let items = [-360, -270, -180, -90, 0, 90, 180, 270, 360];
	let item = items[Math.floor(Math.random() * items.length)];
	return item;
}

function randomRotdirN() {
	let items = [-270, -180, -90, 90, 180, 270];
	let item = items[Math.floor(Math.random() * items.length)];
	return item;
}

function flashColor(track, time, dur, color, ease) {
	_customEvents.push({
		_time: time,
		_type: "AnimateTrack",
		_data: {
			_track: track,
			_duration: dur,
			_easing: (ease) ? ease : EL,
			_color: (color) ? color : [[1, 1, 1, 1, 0]]
		}
	})
}

function particleCircle(beat, endBeat, amount, radius, x, y, z, color, trackL) {
	for (let i = 0; i < amount; i++) {
		let partTrack = `particle,${beat},${i}`;
		let duration = (endBeat - beat) + HJD;
		let offset = (duration / amount) * i;
		_obstacles.push({
			_time: (beat+HJD)+offset,
			_duration: 7,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData: {
				_interactable: false,
				_track: partTrack,
				_scale: [0.05, 0.05, 0.05],
				_rotation: [0+offset, 0, getRndInteger(-360, 360)-offset],
				_localRotation: [0, 0, 0],
				_position: [0, 0],
				_animation: {
					_color: (color) ? color : [[1, 1, 1, 1, 0]],
					_definitePosition: [[0,radius,0,0],[0,radius/2,-radius/2,1, "easeInSine"]],
					_rotation: [[0,0,0,0],[0,0,90.9,1, "easeInCirc"]],
					_dissolve: [[0,0],[1,0],[1,0.9],[0,1]]
				}
			}
		})

		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [partTrack],
			  _parentTrack: "partTrackP"
			}
		})

		if (trackL) {
			_customEvents.push({
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: ["partTrackP"],
				  _parentTrack: trackL
				}
			})

		}

		_customEvents.push({
			_time: beat,
			_type: "AnimateTrack",
			_data:{
				_track: "partTrackP",
				_duration: duration,
				_position: [[x,y,z,0]]
			}
		})

	}

	tracks.push("partTrackP");
}

function particleCircleLorg(beat, endBeat, amount, radius, x, y, z, color) {
	for (let i = 0; i < amount; i++) {
		let partTrack = `particle,${beat},${i}`;
		let duration = (endBeat - beat) + HJD;
		let offset = (duration / amount) * i;
		_obstacles.push({
			_time: beat+offset,
			_duration: 7,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData: {
				_interactable: false,
				_track: partTrack,
				_scale: [8, 0.05, 0.05],
				_rotation: [25, 0, getRndInteger(-360, 360)],
				_localRotation: [0, 0, 0],
				_position: [0, 0],
				_animation: {
					_color: (color) ? color : [[1, 1, 1, 1, 0]],
					_definitePosition: [[0,radius,0,0],[0,radius/2,-radius/2,1, "easeInSine"]],
					_rotation: [[0,0,0,0],[0,0,90.9,1, "easeInCirc"]],
					_dissolve: [[0,0],[1,0],[1,0.9],[0,1]]
				}
			}
		})

		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [partTrack],
			  _parentTrack: "partTrackP"
			}
		})

		_customEvents.push({
			_time: beat,
			_type: "AnimateTrack",
			_data:{
				_track: "partTrackP",
				_duration: duration,
				_position: [[x,y,z,0]]
			}
		})

	}
}

function spin(track, type, start, end, times, ease) {
	let dur = ((end - start)) / times;
	for (let i = 0; i < times; i++) {
		_customEvents.push({
			_time: start + (dur * i),
			_type: "AnimateTrack",
			_data: {
				_track: track,
				_easing: ease,
				_duration: dur,
				_rotation: type
			}
		})

	}

}

function localSpin(track, type, start, end, times, ease) {
	let dur = ((end - start)) / times;
	for (let i = 0; i < times; i++) {
		_customEvents.push({
			_time: start + (dur * i),
			_type: "AnimateTrack",
			_data: {
				_track: track,
				_easing: ease,
				_duration: dur,
				_localRotation: type
			}
		})

	}

}

function disSpinIn(track, start, end, dir) {
	let dur = (end - start) + HJD;
	let newTrack = track;
	let pTrack = `spinIn,${start}`

	DisIn(track, start);

	_customEvents.push({
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
			_childrenTracks: [newTrack],
			_parentTrack: pTrack
		}
	})

	_customEvents.push({
		_time: start,
		_type: "AnimateTrack",
		_data: {
			_track: pTrack,
			_duration: dur,
			_rotation: (dir == "l") ? [[0, 0, -90, 0], [0, 0, 0, 1, "easeOutCirc"]] : [[0, 0, 90, 0], [0, 0, 0, 1, "easeOutCirc"]],
			_scale: [[0.125, 0.125, 1, 0], [1, 1, 1, 1, "easeOutCirc"]]
		}
	})
}

_pointDefinitions.push({
	_name: "spinAroundY",
	_points: [
		[0, 0, 0, 0],
		[0, 90, 0, 0.25],
		[0, 180, 0, 0.5],
		[0, 270, 0, 0.75],
		[0, 0, 0, 1]
	]
}, {
	_name: "spinAroundYneg",
	_points: [
		[0, 0, 0, 0],
		[0, -90, 0, 0.25],
		[0, -180, 0, 0.5],
		[0, -270, 0, 0.75],
		[0, 0, 0, 1]
	]
});
_pointDefinitions.push({
	_name: "spinAroundX",
	_points: [
		[0, 0, 0, 0],
		[90, 0, 0, 0.25],
		[180, 0, 0, 0.5],
		[270, 0, 0, 0.75],
		[0, 0, 0, 1]
	]
}, {
	_name: "spinAroundXneg",
	_points: [
		[0, 0, 0, 0],
		[-90, 0, 0, 0.25],
		[-180, 0, 0, 0.5],
		[-270, 0, 0, 0.75],
		[0, 0, 0, 1]
	]
});
_pointDefinitions.push({
	_name: "spinAroundZ",
	_points: [
		[0, 0, 0, 0],
		[0, 0, 90, 0.25],
		[0, 0, 180, 0.5],
		[0, 0, 270, 0.75],
		[0, 0, 0, 1]
	]
})

// console.log(Spin8)

_pointDefinitions.push({
	_name: "spinAroundZneg",
	_points: [
		[0, 0, 0, 0],
		[0, 0, -90, 0.25],
		[0, 0, -180, 0.5],
		[0, 0, -270, 0.75],
		[0, 0, 0, 1]
	]
});

_pointDefinitions.push({
	_name: "wave",
	_points: [
		[0, 0, 0, 0],
		[0.5, 0, 0, 0.125],
		[0.1, 0, 0, 0.25],
		[0.5, 0, 0, 0.375],
		[0, 0, 0, 0.5],
		[0.5, 0, 0, 0.625],
		[0.1, 0, 0, 0.75],
		[0.5, 0, 0, 0.875],
		[0, 0, 0, 1]
	]
});

let amount = 15;
_pointDefinitions.push({
	_name: "waveRot",
	_points: [
		  [0, 0, 0, 0],
		  [-amount, amount, 0, 0.125],
		  [0, 0, 0, 0.25],
		  [amount, -amount, 0, 0.375],
		  [0, 0, 0, 0.5],
		  [-amount, amount, 0, 0.625],
		  [0, 0, 0, 0.75],
		  [amount, -amount, 0, 0.875],
		  [0, 0, 0, 1]
	  ]
  })

_pointDefinitions.push({
	_name: "RainbowWhite",
	_points: [
		[1, 0.9, 0.9, 0.5, 0],
		[1, 0, 0, 0.5, 0.2],
		[0.25, 0.9, 0, 0.5, 0.4],
		[0.25, 0, 0.9, 0.5, 0.6],
		[0.25, 0.9, 0.9, 0.5, 0.8],
		[1, 0.9, 0.9, 0.5, 1],
	]
})

_pointDefinitions.push({
	_name: "Rainbow",
	_points: [
		[20, 0, 0, 20, 0],
		[20, 20, 0, 20, 0.166],
		[0, 20, 0, 20, 0.332],
		[0, 20, 20, 20, 0.498],
		[0, 0, 20, 20, 0.66425],
		[20, 0, 20, 20, 0.835],
		[20, 0, 0, 20, 1],
	]
})

_pointDefinitions.push({
	_name: "colorWave",
	_points: [
		[1, 1, 1, 1, 0],
		[0, 0, 4, 1, 0.125],
		[0, 0.5, 2, 1, 0.25],
		[0, 0, 1, 1, 0.375],
		[1, 1, 2, 1, 0.5],
		[0, 0, 4, 1, 0.625],
		[0, 0.25, 2, 1, 0.75],
		[0.1, 0.2, 1, 1, 0.875],
		[2, 2, 2, 2, 1]
	]
});

/*

function lineExpand(start, end, amount) {
	let dur = (end - start) + HJD;
	for (let i = 0; i < amount; i++) {
		_obstacles.push({
			_time: start+HJD,
			_duration: 8,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: "lines",
				_scale: [1,1,1],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [0,0,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]]
				}
			}
		})
		
	}

}



_environment.push({
	_id: "BigTrackLaneRing",
	_lookupMethod: "Regex, Exact, Contains",
	// _duplicate: 0,
	_active: true,
	_scale: [1,1,1],
	_position: [0,0,0],
	_localPosition: [0,0,0],
	_rotation: [0,0,0],
	_localRotation: [0,0,0],
	_track: "test"
})

_customEvents.push({
	_time: 4,
	_type: "AssignPathAnimation",
	_data:{
		_track: "track",
		_duration: 2,
		_rotation: [[0,0,0,1]]
	}
})

_obstacles.push({
	_time: 4,
	_duration: 8,
	_lineIndex: 0,
	_type: 0,
	_width: 0,
	_customData:{
		_interactable: false,
		_track: "track",
		_scale: [1,1,1],
		_rotation: [0,0,0],
		_localRotation: [0,0,0],
		_position: [0,0],
		_animation: {
			_color: (color) ? color : [[1,1,1,1,0]]
		}
	}
})

_customEvents.push({
	_time: float,
	_type: "AssignTrackParent",
	_data: {
	  _childrenTracks: [string],
	  _parentTrack: string
	}
})

_customEvents.push({
	_time: 4,
	_type: "AnimateTrack",
	_data:{
		_track: "track",
		_duration: 2,
		_rotation: [[0,0,0,1]]
	}
})

*/

// _notes.forEach(n => {
// 	n._customData = {};
// 	n._customData._animation = {};
// 	n._customData._animation._dissolve = [[0,0]];
// 	n._customData._animation._dissolveArrow = [[0,0]];
// })

// particleCircle(6, 134, 64*8, 14, 0, 1, 20);

//make a 3d grid of new generating walls going only 1 way

function shakey(points, xAmount, yAmount, zAmount, easing = "easeLinear") {
	let int = 1 / points;
	let path = [];
	for (let point = 0; point < points; point++) {
	  path.push([
		Math.random() * xAmount - xAmount / 2,
		Math.random() * yAmount - yAmount / 2,
		Math.random() * zAmount - zAmount / 2,
		int * point,
		easing
	  ]);
	}
	path.push([0, 0, 0, 1, easing]);
	return path;
  }

//#region old sphere N

/*

function sphere(sphereTrack, start, end, radius, amount, thickness, color, offsetZ) {
	for (let i = 0; i < amount/2; i++) {
		let track = `${sphereTrack},${start},${i}`
		let l = (2 * radius * Math.tan(Math.PI / amount));
		CircRots(track, start, (end-start), radius, amount, thickness, l, 0, 0, 0, 0, 0+(360/amount)*i, 0, 9999, color);

	}
}

sphere("sphereTest", 6, 134, 2, 16*6, 0.1, [[0.1,0.1,0.1,0,0]], 0);

*/

//#endregion

//#region Hex Wave GONE, REMOVED, DEATH, kil.

/*

for (let rots = 0; rots < 8; rots++) {
	for (let x = 0; x < 2.25*2; x+=2.25) {
		for (let y = 0; y < 2*2; y+=2) {
		  let xPoss = 15;
		  let yPoss = 15;
		  let zPoss = 0.65-15;
	
		  let xRotss = 0;
		  let yRotss = 0;
		  let zRotss = 0+45*rots;
	
		  let track = `testWave${x},${y},${rots}`;
		  let track1 = `testWave1${x},${y},${rots}`;
		  let int = ((0.815*x)+(0.815*y));
		  let ease = EL;
		  let dur = 16;
	
		  Circ(track, (2+int)+HJD, 134-HJD, 1, 6, 0.05, 0.05, 0, 0, -1, 0, 134-HJD, [[1,1,1,1,1]])
	  
		  _customEvents.push({
			_time: 0, // Time in beats.
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [track],
			  _parentTrack: track1,
			  // _duration: 128,
			}
		  })
	
		  _customEvents.push({
			_time: 0, // Time in beats.
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [track1],
			  _parentTrack: `track2,${rots}`,
			  // _duration: 128,
			}
		  })
	
		  _customEvents.push({
			_time: 0, // Time in beats.
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [`track2,${rots}`],
			  _parentTrack: "allTrack",
			  // _duration: 128,
			}
		  })

		  _customEvents.push({
			_time: 0, // Time in beats.
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: ["allTrack"],
			  _parentTrack: "allTrackReal",
			  // _duration: 128,
			}
		  })
	  
		  _customEvents.push({
			_time: (2+int)-HJD,
			_type: "AnimateTrack",
			_data:{
			  _track: track,
			  _duration: dur,
			  _easing: ease,
			  _dissolve: [[0,0.25],[1,0.8]]
			}
		  })
	
		  for (let i = 0; i < 16; i++) {
			_customEvents.push({
			  _time: (1+int)+dur*i,
			  _type: "AnimateTrack",
			  _data:{
				_track: track1,
				_duration: dur,
				_easing: ease,
				_localRotation: "waveRot",
			  }
			})
		  }
	  
		  for (let i = 0; i < 16; i++) {
			_customEvents.push({
			  _time: (-1+int)+dur*i,
			  _type: "AnimateTrack",
			  _data:{
				_track: track1,
				_duration: dur,
				_easing: ease,
				_position: [
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+0,0],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+-0.5,0.125],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+0,0.25],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+0.5,0.375],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+0,0.5],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+-0.5,0.625],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+0,0.75],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+0.5,0.875],
				  [(xPoss+x)+(0.57*y),yPoss+y,zPoss+0,1]
				],
			  }
			})
		  }
	
		_customEvents.push({
			_time: 0,
			_type: "AnimateTrack",
			_data:{
				_track: `track2,${rots}`,
				_duration: 9999,
				_rotation: [[xRotss,yRotss,zRotss,0]],
				_localRotation: [[-35,35,-25,0]]
			}
		})
	  
		  for (let i = 0; i < 16; i++) {
			_customEvents.push({
			  _time: (0+int)+dur*i,
			  _type: "AnimateTrack",
			  _data:{
				_track: track,
				_duration: dur,
				// _easing: "easeInOutSine",
				_color: "colorWave",
				// _dissolve: [[1-0.025*y,0]]
				// _color: "Rainbow"
			  }
			})
		  }
		}
	
	}
	
}

_customEvents.push({
	_time: 0,
	_type: "AnimateTrack",
	_data:{
		_track: "allTrack",
		_position: [[0,4,24+16,0]],
		_scale: [[1,1,1,0]]
	}
})

_customEvents.push({
	_time: 6-HJD,
	_type: "AnimateTrack",
	_data:{
		_track: "allTrack",
		_duration: 16,
		// _position: [[0,4,24+16,0]],
		_scale: [[0,0,0,0],[1,1,1,1, "easeOutCirc"]]
	}
})

_customEvents.push({
	_time: 122,
	_type: "AnimateTrack",
	_data:{
		_track: "allTrack",
		_duration: 12,
		// _position: [[0,4,24+16,0]],
		_scale: [[1,1,1,0],[0,0,0,1, "easeInCirc"]]
	}
})

tracks.push("allTrack");

*/

//#endregion

//#region sphere

function sphere(track, start, end, resolution, size, pos, color) {
    const deg2rad = Math.PI / 180;
    let step = 360 / resolution;
    let count = 0;
    for (let x = 0; x <= 180; x += step) {
        for (let y = 0; y < 360; y += step) {
            let rot = [x, y, 0];
            let mathRot = copy(rot);
            let tileSize = 2 * size * Math.tan(Math.PI / (resolution)) * 1.02;
            mathRot = mathRot.map(z => z * deg2rad);

            let dir = new three.Vector3(0, size, -tileSize/2).applyEuler(new three.Euler(...mathRot, "YXZ"));
            let newPos = [dir.x, dir.y, dir.z];
            newPos[0] += pos[0] - (tileSize/2);
            newPos[1] += pos[1] - (tileSize/2);
            newPos[2] += pos[2] - (tileSize/2);

            _obstacles.push({
                _time: start + HJD,
                _lineIndex: 0,
                _type: 0,
                _duration: end - start,
                _width: 0,
                _customData: {
                    _color: color,
                    _animation: {
                        _definitePosition: newPos,
                        _localRotation: rot
                    },
                    _scale: [tileSize, 0.1, tileSize],
                    _track: track
                }
            })

            count++;
        }
    }

    console.log("Walls in sphere: " + count);
}

// sphere("testSphere", 6, 134, 16*8, 4, [0,200,0], [0.25,0.25,0.25,0]);

//#endregion

//#region partLoop

function partLoop(start, end, amount, color) {
	for (let i = 0; i < amount; i++) {
		let trackL = `partLoopL,${start},${i}`;
		let trackR = `partLoopR,${start},${i}`;
		spin(trackL, "spinAroundZneg", 6, 134, 4, EL);
		spin(trackR, "spinAroundZneg", 6, 134, 4, EL);
		let dur = (((end - start) / amount) + HJD)*4;
		let offs = ((end - start) / amount) * i;
		_obstacles.push({
			_time: start + offs, //left
			_duration: dur-HJD,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: trackL,
				_scale: [0.25,0.25,0.05],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [-4,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[0,0,0,0],[-7,0,26,0.25, "easeOutCubic"],[16,-10,0,1, "easeInOutCubic"]],
					_rotation: [
						[0,0,0,0],
						[0,0,180,0.5, "splineCatmullRom"],
						[0,0,360,1, "splineCatmullRom"],
					],
					_localRotation: [
							[
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								0
							],
							[
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								1
							]
								],
					_dissolve: [[0,0],[1,0.1],[1,0.9],[0,1]],
					_scale: [[1,1,1,0],[1,1,100,1]]
				}
			}
		},{
			_time: start + offs, //right
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: trackR,
				_scale: [0.25,0.25,0.05],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [4,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[0,0,0,0],[7,0,26,0.25, "easeOutCubic"],[-16,10,0,1, "easeInOutCubic"]],
					_rotation: [
						[0,0,0,0],
						[0,0,180,0.5, "splineCatmullRom"],
						[0,0,360,1, "splineCatmullRom"],
					],
					_localRotation: [
							[
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								0
							],
							[
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								getRndInteger(-0, 0),
								1
							]
								],
					_dissolve: [[0,0],[1,0.1],[1,0.9],[0,1]],
					_scale: [[1,1,1,0],[1,1,100,1]]
				}
			}
		})

		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [trackL, trackR],
			  _parentTrack: "trackLR"
			}
		})

		_customEvents.push({
			_time: 6-HJD,
			_type: "AnimateTrack",
			_data:{
				_track: "trackLR",
				_duration: (134-6) + HJD,
				_position: [[0,4,0,0],[0,4,-4,1]]
			}
		})
		
		tracks.push("trackLR");

	}
	
}

partLoop(6, 134, 256, [[0,0.5,1,1,0],[0,2,1,2,0.5],[0,0,2,2,0.75]]);

for (let i = 0; i < ((134 - 6) / 4) - 1; i++) {
	let track = `moveOut${i}`
	let time = 12+4*i;
	Circ(track, time, 2, 9, 16, 0.05, 0.05, 0, 4, 24, 0, time+2, [[0,0.25,2,-40,0]]);

	DisIn(track, time);

	// spin(track, "spinAroundZ", time, time+8, 1, EL);

	// for (let n = 0; n < (134 - 6) / 16; n++) {
		_customEvents.push({
			_time: time,
			_type: "AnimateTrack",
			_data:{
				_track: track,
				_duration: 2,
				_position: [[0,0,12,0], [0,0,-24,1]],
				_scale: [[0.01,0.01,10,0],[0.01,0.01,50,1]]
			}
		})
		
	// }

	tracks.push(track);
}

//#endregion

//#region FIRST PART ADDON TO NO MORE EMPTY N


// Circ("Triangleularmuisdlf1", 6, (134-6), 14, 16, 0.05, 0.05, 0, 0, 30, 90, 134, [[0,1,2,2,0]]);

// DisIn("Triangleularmuisdlf1", 6);


// Circ("Triangleularmuisdlf2", 6, (134-6), 14, 16, 0.05, 0.05, 0, 0, 30, 90, 134, [[0,1,2,2,0]]);

// DisIn("Triangleularmuisdlf2", 6);

// spin("Triangleularmuisdlf1", "spinAroundZ", 6-HJD, (134-6)+HJD, 3, EL);
// spin("Triangleularmuisdlf2", "spinAroundZneg", 6-HJD, (134-6)+HJD, 3, EL);

// _customEvents.push({
// 	_time: 0.001,
// 	_type: "AnimateTrack",
// 	_data:{
// 		_track: "Triangleularmuisdlf1",
// 		_localRotation: [[0,25,0,0]]
// 	}
// })

// _customEvents.push({
// 	_time: 0.001,
// 	_type: "AnimateTrack",
// 	_data:{
// 		_track: "Triangleularmuisdlf2",
// 		_localRotation: [[0,-25,0,0]]
// 	}
// })

// _customEvents.push({
// 	_time: 0.1,
// 	_type: "AssignTrackParent",
// 	_data: {
// 	  _childrenTracks: ["Triangleularmuisdlf1", "Triangleularmuisdlf2"],
// 	  _parentTrack: "yourMomsPlace"
// 	}
// })

// _customEvents.push({
// 	_time: 0.1,
// 	_type: "AssignTrackParent",
// 	_data: {
// 	  _childrenTracks: ["yourMomsPlace"],
// 	  _parentTrack: "yourMomsPlace2"
// 	}
// })

// _customEvents.push({
// 	_time: 6-HJD,
// 	_type: "AnimateTrack",
// 	_data:{
// 		_track: "yourMomsPlace",
// 		_duration: HJD*4,
// 		_scale: [[0,0,0,0],[1,1,1,1]],
// 		_position: [[0,3,30,0],[0,3,0,1, "easeOutCubic"]]
// 	}
// })

// _customEvents.push({
// 	_time: 126,
// 	_type: "AnimateTrack",
// 	_data:{
// 		_track: "yourMomsPlace",
// 		_duration: HJD,
// 		_scale: [[1,1,1,0],[0,0,0,1]]
// 	}
// })

// tracks.push("yourMomsPlace2");

//#endregion

//#region THE BUILD YESSS 134 - 190 (paths)

//parent track partical path?

function path(start, end, color) {
	let amount = (end - start);
	let dur = 8;
	let offs = 4;
	let size = 1 + HJD;  //skull reaction
	let sideAmount = 4;
	for (let i = 0; i < amount; i++) {
		let track = `path,${start},${i}`;

		flashColor(track, start+i, 1, color, EL);	
		DisInS(track, start+i, 8, 0.5);
		DisOut(track, end+0.5);

		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [track],
			  _parentTrack: "allTrack"
			}
		})

		_obstacles.push({
			_time: (start+HJD)+i,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: track,
				_scale: [6,0.05,size],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [-3,-0.1],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[0,0,0,0]],
					_dissolve: [[1,0.6],[0,0.75]]
				}
			}
		})

		_customEvents.push({
			_time: (start-(1/offs))+i,
			_type: "AnimateTrack",
			_data:{
				_track: track,
				_duration: dur,
				_position: [[(tog)?sideAmount:-sideAmount,0,20,0],[0,0,-size*2,1]]
			}
		})	

		tracks.push(track);

		tog = !tog;
	}
}

function flashPath(start, end, color) {
	let amount = (end - start);
	let dur = 8;
	let offs = 2;
	let size = 1 + HJD;  //skull reaction
	let sideAmount = 4;
	for (let i = 0; i < amount; i++) {
		let track = `path,${start},${i}`;

		flashColor(track, start+i, 1, color, EL);	
		DisInS(track, start+i, 8, 0.5);
		DisOut(track, end+0.5);
		DisIn("lightPath", start);

		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [track],
			  _parentTrack: "allTrack"
			}
		})

		_obstacles.push({
			_time: (start+HJD)+i,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: [track, "lightPath"],
				_scale: [6,0.05,size],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [-3,-0.1],
				_animation: {
					_definitePosition: [[0,0,0,0]],
					_dissolve: [[1,0.6],[0,0.75]]
				}
			}
		})

		flashColor("lightPath", start+2*i, 2, [[3,3,3,3,0],[0,0,0,1,1]], EL);

		_customEvents.push({
			_time: (start-(1/offs))+i,
			_type: "AnimateTrack",
			_data:{
				_track: track,
				_duration: dur,
				_position: [[(tog)?sideAmount:-sideAmount,0,16,0],[0,0,-size*2,1]],
				_rotation: [[0,getRndInteger(-45,45),0,0],[0,0,0,1/offs, "easeOutCubic"]]
			}
		})

		tracks.push(track);

		tog = !tog;
	}
}

path(134, 190, [[0,0,3,3,0],[1,1,1,0.5,1, "easeOutQuint"]]);

flashPath(198-1, 254, [[1,1,1,1,0],[0.1,1,2,4,1]]);

//#endregion

//#region Circle Rise
function circleRise(start, end, dens, color){
	let rndRotX = getRndInteger(-360 ,360);
	let rndRotY = getRndInteger(-360 ,360);
	let rndRotZ = getRndInteger(-360 ,360);
	let rndRotX2 = getRndInteger(-360 ,360);
	let rndRotY2 = getRndInteger(-360 ,360);
	let rndRotZ2 = getRndInteger(-360 ,360);
	for (let i = 0; i < dens; i++) {
		let track = `circleRise,${start},${i}`;
		let dur = (end - start);
		let offs = (dur / dens) * i;
		Circ(track, start+offs, dur, 80, 16, 5, 5, 0, 0, -1, 0, start+i, color);
		
		_customEvents.push({
			_time: (start-HJD)+offs,
			_type: "AnimateTrack",
			_data:{
				_track: track,
				_duration: 2,
				_rotation: [[rndRotX,rndRotY,rndRotZ,0],[rndRotX2,rndRotY2,rndRotZ2,0.5, "easeOutCirc"]],
				_position: [[0,0,120,0],[0,0,-120,1]]
			}
		})

		tracks.push(track);
	}

}

// circleRise(142, 150, 16, [[0,0,2,2,0]]);

// circleRise(158, 178, 28, [[0,0,2,2,0]]);
// circleRise(172, 178, 12, [[2,2,2,2,0]]);


//#endregion

//#region lines idek LETS GOOO YATTAAA

function lines(start, end, amount, color) {
	let dur = (end - start);
	for (let i = 0; i < amount; i++) {
		let track = `lines,${start}`;
		_obstacles.push({
			_time: start+HJD,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: track,
				_scale: [0.05,100,0.05],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [-16.025,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[0,0,100,0],[0,0,10,1, "easeOutCubic"]],
					_rotation: [[0,0+(360/32)*i,0,0],[0,360+(360/32)*i,0,1, "easeInOutCubic"]],
					_localRotation: [[0,0,0+(360/32)*i,0],[0,0,360+(360/32)*i,1, "easeInOutCubic"]],
					_dissolve: [[0,0],[1,0.25],[1,0.75],[0,1]]
				}
			}
		})
		
		// _customEvents.push({
		// 	_time: 0,
		// 	_type: "AssignTrackParent",
		// 	_data: {
		// 	  _childrenTracks: [track],
		// 	  _parentTrack: `linesP,${start}`
		// 	}
		// })
		
		// _customEvents.push({
		// 	_time: 4,
		// 	_type: "AnimateTrack",
		// 	_data:{
		// 		_track: track,
		// 		_duration: 2,
		// 		_rotation: [[0,0,0,1]]
		// 	}
		// })
		
		tracks.push(track);

	}
}

function lines2(start, end, amount, color) {
	let dur = (end - start);
	for (let i = 0; i < amount; i++) {
		let track = `lines,${start}`;
		_obstacles.push({
			_time: start+HJD,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: track,
				_scale: [0.05,100,0.05],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [-16.025,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[0,0,100,0],[0,0,25,1, "easeOutCubic"]],
					_rotation: [[0,0-(360/32)*i,0,0],[0,90-(360/32)*i,0,1, "easeInOutCubic"]],
					_localRotation: [[0,0,0,0],[0,0,360-(360/32)*i,1, "easeInOutCubic"]],
					_dissolve: [[0,0],[1,0.25],[1,0.75],[0,1]]
				}
			}
		})
		
		// _customEvents.push({
		// 	_time: 0,
		// 	_type: "AssignTrackParent",
		// 	_data: {
		// 	  _childrenTracks: [track],
		// 	  _parentTrack: `linesP,${start}`
		// 	}
		// })
		
		// _customEvents.push({
		// 	_time: 4,
		// 	_type: "AnimateTrack",
		// 	_data:{
		// 		_track: track,
		// 		_duration: 2,
		// 		_rotation: [[0,0,0,1]]
		// 	}
		// })
		
		tracks.push(track);

	}
}

function lines3(start, end, amount, color) {
	let dur = (end - start);
	for (let i = 0; i < amount; i++) {
		let track = `lines,${start}`;
		_obstacles.push({
			_time: start+HJD,
			_duration: dur,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: track,
				_scale: [0.05,100,0.05],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [-16.025,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[0,0,150,0],[0,0,50,1, "easeOutCubic"]],
					_rotation: [[0,0-(360/32)*i,0,0],[0,45-(360/32)*i,0,1, "easeInOutCubic"]],
					_localRotation: [[0,0,0,0],[0,360-(360/32)*i,360-(360/32)*i,1, "easeOutCubic"]],
					_dissolve: [[0,0],[1,0.25],[1,0.75],[0,1]]
				}
			}
		})
		
		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [track],
			  _parentTrack: `linesP,${start}`
			}
		})

		localSpin(`linesP,${start}`, "spinAroundYneg", start+HJD, end, 2, EL);
		
		tracks.push(track);

	}
}

lines(142, 150, 32, [[1,1,1,1,0],[1,0.5,0,10,1]]);
lines2(158, 178, 32, [[0,0,0,0,0],[4,2,0.125,6,0.25, "easeInOutCubic"],[8,8,16,8,0.75, "easeOutQuint"],[1,1,1,1,1]]);

lines(190, 198, 16, [[0,0.5,2,4,0],[1,1,0.5,1,1]]);
lines2(190, 198, 16, [[1,1,0.5,1,0],[0,0.5,2,4,1]]);

lines3(214, 234, 32, [[0,0,0,0,0],[4,2,0.125,6,0.25, "easeOutCubic"],[8,8,16,8,0.75, "easeInQuart"],[1,1,1,1,1]]);

//#endregion

//#region inspiration where??? (side objects)

function sideObjects(start, end, amount, color) {
	for (let i = 0; i < amount; i++) {
		let rnd = randomRotdir();
		let track = `sideObjects,${start},${i}`;
		let dur = (end - start) + HJD;
		let offs = (dur / amount) * i;
		let x = (tog)? getRndInteger(-18, -9) : getRndInteger(9, 18);
		let y = getRndInteger(-8, 16);
		let y2 = getRndInteger(-16, 16);
		let z = getRndInteger(20, 65);
		_obstacles.push({
			_time: (start+HJD)+offs,
			_duration: HJD,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: track,
				_scale: [0.05,getRndInteger(6, 12),getRndInteger(1, 6)],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [0,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[x,y,z,0],[x,y2,z,1]],
					_dissolve: [[0,0],[1,0.15],[1,0.85],[0,1]],
					_rotation: [[0,0,randomRotdir(),0],[0,0,0,1, "easeOutCubic"]],
					_localRotation: [[0,randomRotdir(),0,0],[0,0,0,1, "easeOutElastic"]]
				}
			}
		})
		
		tracks.push(track);
		tog = !tog;
	}

}

function sideObjects2(start, end, amount, color) {
	for (let i = 0; i < amount; i++) {
		let track = `sideObjects,${start},${i}`;
		let dur = (end - start) + HJD;
		let offs = (dur / amount) * i;
		let x = (tog)? getRndInteger(-16, -5) : getRndInteger(5, 16);
		let y = getRndInteger(-8, 16);
		let y2 = getRndInteger(-16, 16);
		let z = getRndInteger(8, 24);
		_obstacles.push({
			_time: (start+HJD)+offs,
			_duration: HJD,
			_lineIndex: 0,
			_type: 0,
			_width: 0,
			_customData:{
				_interactable: false,
				_track: track,
				_scale: [0.05,getRndInteger(8, 16),getRndInteger(1, 6)],
				_rotation: [0,0,0],
				_localRotation: [0,0,0],
				_position: [0,0],
				_animation: {
					_color: (color) ? color : [[1,1,1,1,0]],
					_definitePosition: [[x,y,z,0],[x,y2,z,1]],
					_dissolve: [[0,0],[1,0.15],[1,0.85],[0,1]],
					_rotation: [[0,0,randomRotdir(),0],[0,0,0,1, "easeOutCubic"]],
					_localRotation: [[0,randomRotdir(),0,0],[0,0,0,1, "easeOutElastic"]]
				}
			}
		})
		
		tracks.push(track);
		tog = !tog;
	}

}

// function sideObjects22(start, end, amount, color, ) {
// 	for (let i = 0; i < amount; i++) {
// 		let track = `sideObjects2,${start},${i}`;
// 		let dur = (end - start) + HJD;
// 		let offs = (dur / amount) * i;
// 		_obstacles.push({
// 			_time: (start+HJD),
// 			_duration: dur,
// 			_lineIndex: 0,
// 			_type: 0,
// 			_width: 0,
// 			_customData:{
// 				_interactable: false,
// 				_track: track,
// 				_scale: [getRndInteger(-20,20),getRndInteger(-20,20),getRndInteger(-20,20)],
// 				_rotation: [getRndInteger(-360,200),getRndInteger(-360,200),getRndInteger(-360,200)],
// 				_localRotation: [getRndInteger(-360,200),getRndInteger(-360,200),getRndInteger(-360,200)],
// 				_position: [getRndInteger(-50,50),getRndInteger(-50,50)],
// 				_animation: {
// 					_color: (color) ? color : [[1,1,1,1,0]],
// 					_definitePosition: [[0,0,0,0]]
// 				}
// 			}
// 		})

// 		_customEvents.push({
// 			_time: 0,
// 			_type: "AssignTrackParent",
// 			_data: {
// 			  _childrenTracks: [track],
// 			  _parentTrack: "allSides2"
// 			}
// 		},{
// 			_time: 0,
// 			_type: "AssignTrackParent",
// 			_data: {
// 			  _childrenTracks: ["allSides2"],
// 			  _parentTrack: "allSides22"
// 			}
// 		})
		
// 		_customEvents.push({
// 			_time: start,
// 			_type: "AnimateTrack",
// 			_data:{
// 				_track: "allSides2",
// 				_duration: 64+HJD,
// 				_easing: "easeInOutCirc",
// 				_scale: "colorWave"
// 			}
// 		})

// 		tracks.push("allSides22");
		
// 	}

// }

// sideObjects22(198, 198+64, 64);

filterednotes = _notes.filter(n => n._time >= 134 && n._time <= 190-HJD);
filterednotes.forEach(note => {
	if (note._type == 0) {
		sideObjects(note._time+HJD,(note._time+HJD)+1, 2, [[1,1,1,2,0],[0,0,0,0,1]]);

	}

})

filterednotes = _notes.filter(n => n._time >= 134 && n._time <= 190-HJD);
filterednotes.forEach(note => {
	if (note._type == 1) {
		sideObjects2(note._time+HJD,(note._time+HJD)+1, 2, [[1,1,1,2,0],[0,0,0,0,1]]);
		
	}

})

//#endregion

//#region how when the (tri path)

let times = (254 - 198)-1;
for (let i = 0; i < times; i++) {
	let start = 198;
	let end = 254;
	let oat = (end - start);

	let offs = (end - start) / times;
	let track = `triPath,${i}`;
	CircMove(track, (start)+i*offs, HJD*2, 11, 3, 0.05, 0.05, 0, 0, 0, 90+(360/16)*i, [[0.5,3.5,10,11,0]], 2, 20);
	DisInS(track, (start)+i*offs, 16, 0.545);

	// _customEvents.push({
	// 	_time: 0,
	// 	_type: "AnimateTrack",
	// 	_data: {
	// 		_track: "triPath",
	// 		_noteJumpStartBeatOffset: 4,
	// 		_startNoteJumpMovementSpeed: 60
	// 	}
	// })

	_customEvents.push({
		_time: start,
		_type: "AssignPathAnimation",
		_data: {
			_track: track,
			_duration: 1,
			_rotation: [[20,20,0,0.25],[0,0,0,0.75]],
			_scale: [[0.1,0.1,0.1,0],[1,1,1,0.125]]
			// _noteJumpStartBeatOffset: 4,
			// _startNoteJumpMovementSpeed: 60
		}
	})

	_customEvents.push({
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
			_childrenTracks: [track],
			_parentTrack: "triPathPP"
		}
	})

	let times2 = 1;

	for (let a = 0; a < times2; a++) {
		_customEvents.push({
			_time: start+a*((oat/times2)+(HJD*2)/4),
			_type: "AnimateTrack",
			_data: {
				_track: "triPathPP",
				_duration: ((oat/times2)+(HJD*2)/4)+HJD,
				_rotation: "spinAroundZ",
				_position: [[0,0,55,0]]
			}
		})
		
	}
	
	tracks.push("triPathPP");
}

//#endregion



//#region Reddek drop1 (Squares) N

function square(track, start, end, scale, rots, color) {
	_obstacles.push({
		_time: start,
		_duration: (end - start),
		_lineIndex: 0,
		_type: 0,
		_width: 0,
		_customData:{
			_interactable: false,
			_track: `${track},${start}`,
			_scale: [scale,0.05,scale],
			_rotation: [0,0,0],
			_localRotation: [0,0,0],
			_position: [-0.5,-0.1],
			_animation: {
				_color: (color) ? color : [[1,1,1,10,0]],
				_definitePosition: [[0,0,-(HJD),0]]
			}
		}
	})
	
	_customEvents.push({
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
		  _childrenTracks: [`${track},${start}`],
		  _parentTrack: track
		}
	})

	_customEvents.push({
		_time: 0,
		_type: "AnimateTrack",
		_data:{
			_track: track,
			_duration: 999,
			_rotation: [[0,rots,0,0]]
		}
	})
}

function squareRow(track, start, end, amount, color) {
	for (let i = 0; i <= amount; i++) {
		let tracks = `${track},${i}`;
		let ha = amount / 2;
		square(tracks, start, end, 1, -45, color)
		
		_customEvents.push({
			_time: start-HJD,
			_type: "AnimateTrack",
			_data:{
				_track: tracks,
				_duration: (end - start) + HJD,
				_position: [[(-ha)+i,0,(-ha)+i,0]]
			}
		}) 

		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [tracks],
			  _parentTrack: "trackSquare2"
			}
		},{
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: ["trackSquare2"],
			  _parentTrack: track
			}
		})

		_customEvents.push({
			_time: start-HJD,
			_type: "AnimateTrack",
			_data:{
				_track: "trackSquare2",
				_duration: (end - start) + HJD,
				_position: [[0,0,0,0]],
				_rotation: [[0,90,0,0]]
			}
		}) 

	}

}

function squareColumn(track, start, end, amount, color) {
	// for (let i = 0; i <= amount; i++) {
		let tracks = `${track},${i}`;
		let ha = amount / 2;
		square(tracks, start, end, 1, -45, color)
		
		_customEvents.push({
			_time: start-HJD, //FINISH IT
			_type: "AnimateTrack",
			_data:{
				_track: tracks,
				_duration: (end - start) + HJD,
				_position: [[(-ha)+i,0,(-ha)+i,0]]
			}
		}) 

		_customEvents.push({
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: [tracks],
			  _parentTrack: "trackSquare2"
			}
		},{
			_time: 0,
			_type: "AssignTrackParent",
			_data: {
			  _childrenTracks: ["trackSquare2"],
			  _parentTrack: track
			}
		})

		_customEvents.push({
			_time: start-HJD,
			_type: "AnimateTrack",
			_data:{
				_track: "trackSquare2",
				_duration: (end - start) + HJD,
				_position: [[0,0,0,0]],
				_rotation: [[0,90,0,0]]
			}
		}) 

	// }

}



// squareRow("hi", 4, 128, 2, [[1,1,1,1,0]]);

// tracks.push("hi");

//#endregion

//#region tunnel thing??? the REAL drop1 :sunGlasses:

function tunnelThing(start, end) {
	for (let x = 0; x < 4; x++) {
		for (let i = 0; i < 12; i++) {
			let partTrackk = `tunnelPartTrack,${i},${x},${start}`;
			let partTrackkP = `tunnelPartTrackP,${i},${x},${start}`;
			let partTrackkPP = `tunnelPartTrackPP,${i},${x},${start}`;
			let dur = (end - start) - (HJD+1.075);
			Circ(partTrackk, start+0.01*i+0.01*x, dur, 6, 3, 0.5, 0.05, 0, 0, -1, 0, (end+0.1*i)-(HJD+0.25), [[2-0.25*i,2,10+0.125*i,4+0.5*i,0]]);
			DisIn(partTrackk, start);
	
			_customEvents.push({
				_time: 0,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackk,
					_duration: 2,
					_rotation: [[-90+i,0,-90,1]],
					_localRotation: [[0-(360/8)*i,0+(360/8)*i,0+(360/8)*i,0]]
				}
			})
	
			_customEvents.push({
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackk],
				  _parentTrack: partTrackkP
				}
			},{
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackkP],
				  _parentTrack: partTrackkPP
				}
			},{
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackkPP],
				  _parentTrack: "allTunnelTrackPush"
				}
			})
			
			_customEvents.push({
				_time: 0,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackkP,
					_scale: [[1,1,1+1*i,0]],
					_position: [[0,0+3*i,16+12*i,0]],
					_rotation: [[10,0,0+(11.25)*i,0]]
				}
			})
	
			_customEvents.push({
				_time: start,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackkPP,
					_duration: dur+HJD,
					_position: [[0,50,20-(2)*i,0],[0,50,-538,1]],
					_rotation: [[0,0,90+90*x+(11.25)*i,0]],
					_scale: [[0.5,0.5,0.05,0],[2,2,4,0.25, "easeOutCubic"]]
				}
			})
			localSpin(partTrackkPP, "spinAroundZneg", start-0.5, end+HJD+0.5, 3, EL);
	
			tracks.push("allTunnelTrackPush");
			
		}
		
	}

}

tunnelThing(550-0.25,582);

//#endregion


//#region Drop2 :skull: underwater maybe??? N

/*

function triTri(track, start, dur, scale, posZ, rotZ) {
	let tri1 = `tri1,${start},${posZ},${rotZ}`;
	let tri2 = `tri2,${start},${posZ},${rotZ}`;
	let tri3 = `tri3,${start},${posZ},${rotZ}`;
	Circ(tri1, start, dur-(HJD*2.22), scale, 3, 0.05, 0.05, 0, 0, -1+posZ, 90+rotZ, (start+dur)-HJD, [[10,10,10,10,0]]);
	Circ(tri2, start, dur-(HJD*2.22), scale*2, 3, 0.05, 0.05, 0, 0, -1+posZ, -90+rotZ, (start+dur)-HJD, [[10,10,10,10,0]]);
	Circ(tri3, start, dur-(HJD*2.22), scale*4, 3, 0.05, 0.05, 0, 0, -1+posZ, 45+rotZ, (start+dur)-HJD, [[10,10,10,10,0]]);

	_customEvents.push({
		_time: 0,
		_type: "AssignTrackParent",
		_data: {
		  _childrenTracks: [tri1, tri2, tri3],
		  _parentTrack: track
		}
	})

	spin(track, "spinAroundZ", start, (start+dur)+HJD, 1, EL);

	tracks.push(track);

}

for (let i = 0; i < (646 - 614)/2; i++) {
	let track = `trisBois,${i}`;
	// let track2 = `trisBoi2,${i}`;
	triTri(track, 614+0.0111*i, 646 - 614, 6, 0+18*i, 0+11.25*i);

	// _customEvents.push({
	// 	_time: 0,
	// 	_type: "AssignTrackParent",
	// 	_data: {
	// 	  _childrenTracks: [track],
	// 	  _parentTrack: track2
	// 	}
	// })
	
	_customEvents.push({
		_time: 614-HJD,
		_type: "AnimateTrack",
		_data:{
			_track: track,
			_duration: (646 - 614),
			_position: [[0,0,50,0],[0,0,-50,1]]
		}
	})
	
}

*/

//#endregion

//#region REAL DROP2

function tunnelThing15(start, end) {
	for (let x = 0; x < 3; x++) {
		for (let i = 0; i < 12; i++) {
			let partTrackk = `tunnelPartTrack15,${i},${x},${start}`;
			let partTrackkP = `tunnelPartTrackP15,${i},${x},${start}`;
			let partTrackkPP = `tunnelPartTrackPP15,${i},${x},${start}`;
			let dur = (end - start) - 0.5;
			Circ(partTrackk, (start-(HJD*1.75))+0.01*i+0.01*x, dur, 6, 3, 0.5, 0.05, 0, 0, -1, 0, 9999, [[2-0.035*i,1+0.1*i,2.5+0.125*i,-16+4*i,0]]);
			DisInS(partTrackk, start, 16, 0.5);
	
			_customEvents.push({
				_time: 0,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackk,
					_duration: 2,
					_rotation: [[-90+i,0,-90,1]]
				}
			})
	
			_customEvents.push({
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackk],
				  _parentTrack: partTrackkP
				}
			},{
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackkP],
				  _parentTrack: partTrackkPP
				}
			},{
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackkPP],
				  _parentTrack: "allTunnelTrackPush15"
				}
			})

			localSpin(partTrackkP, "spinAroundZneg", start, end+HJD, 2, EL);
			
			_customEvents.push({
				_time: 0,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackkP,
					_scale: [[1,1,1+1*i,0]],
					_position: [[0,0+3*i,16+16*i,0]],
					_rotation: [[10,0,0+(11.25)*i,0]]
				}
			})
	
			_customEvents.push({
				_time: start-(HJD*2),
				_type: "AnimateTrack",
				_data:{
					_track: partTrackkPP,
					_duration: dur+HJD,
					_position: [[10,50,20,0],[10,50,-127,1]],
					_rotation: [[0,0,90+120*x+(11.25)*i,0]],
					_scale: [[0.5,0.5,0.05,0],[2,2+7,4,0.125, "easeOutCubic"]]
				}
			})
			// localSpin(partTrackkPP, "spinAroundZneg", start, end+HJD, 3, EL);
	
			tracks.push("allTunnelTrackPush15");
			
		}
		
	}

}

tunnelThing15(614,646);

//#endregion

//#region LAST DROP YOU BETTTER BE READDDDYY

function tunnelThing2(start, end) {
	for (let x = 0; x < 4; x++) {
		for (let i = 0; i < 10; i++) {
			let partTrackk = `tunnelPartTrack2,${i},${x},${start}`;
			let partTrackkP = `tunnelPartTrackP2,${i},${x},${start}`;
			let partTrackkPP = `tunnelPartTrackPP2,${i},${x},${start}`;
			let dur = (end - start) - (HJD+1.075);
			Circ(partTrackk, start+0.01*i+0.01*x, dur, 6, 3, 0.5, 0.05, 0, 0, -1, 0, (end+0.1*i)-(HJD+0.25), "Rainbow");
			_customEvents.push({
				_time: start - (16 / 2),
				_type: "AnimateTrack",
				_data: {
					_track: partTrackk,
					_duration: 16,
					_dissolve: [[0, 0.499], [1, 0.5]]
				}
			})
	
			_customEvents.push({
				_time: 0,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackk,
					_duration: 2,
					_rotation: [[-90+i,0,-90,1]]
				}
			})
	
			_customEvents.push({
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackk],
				  _parentTrack: partTrackkP
				}
			},{
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackkP],
				  _parentTrack: partTrackkPP
				}
			},{
				_time: 0,
				_type: "AssignTrackParent",
				_data: {
				  _childrenTracks: [partTrackkPP],
				  _parentTrack: "allTunnelTrackPush2"
				}
			})
			
			_customEvents.push({
				_time: 0,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackkP,
					_scale: [[1,1,1+1*i,0]],
					_position: [[0,0+3*i,16+12*i,0]],
					_rotation: [[10+(11.25)*i,0,0+(11.25)*i,0]]
				}
			})
	
			_customEvents.push({
				_time: start-0.75,
				_type: "AnimateTrack",
				_data:{
					_track: partTrackkPP,
					_duration: dur+HJD,
					_position: [[0,20,40,0],[0,20,-450,1]],
					_rotation: [[0,180,90+90*x+(11.25)*i,0]],
					_scale: [[1,1,0.05,0],[2,2,5,0.125, "easeOutCubic"]]
				}
			})
			localSpin(partTrackkPP, "spinAroundZ", start+0.2, end+(HJD*2)+0.5, 2, EL);
	
			tracks.push("allTunnelTrackPush2");
			
		}
		
	}

}

tunnelThing2(678-0.25,710);

//#endregion

//#region move wallge

_customEvents.push({
	_time: 0,
	_type: "AssignTrackParent",
	_data: {
	  _childrenTracks: tracks,
	  _parentTrack: "note"
	}
})

//#endregion

//#endregion

// OUTPUT

map._events.sort((a, b) => a._time - b._time);
map._notes.sort((a, b) => a._time - b._time);
map._obstacles.sort((a, b) => a._time - b._time);
map._customData._customEvents.sort((a, b) => a._time - b._time);

map._obstacles.forEach(x => {
	if (x._customData._noteJumpMovementSpeed == undefined) x._customData._noteJumpMovementSpeed = 19;
	if (x._customData._noteJumpStartBeatOffset == undefined) x._customData._noteJumpStartBeatOffset = -0.5;
})

fs.writeFileSync(mapInput, JSON.stringify(map), null, 0);