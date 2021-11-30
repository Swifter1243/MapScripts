# ScuffedWalls v1.4.2

# Documentation on functions can be found at
# https://github.com/thelightdesigner/ScuffedWalls/blob/main/Functions.md
            
# DM @thelightdesigner#1337 for more help?

# Using this tool requires an understanding of Noodle Extensions.
# https://github.com/Aeroluna/NoodleExtensions/blob/master/Documentation/AnimationDocs.md

# Playtest your maps

Workspace:Default

0: Import
   Path:ExpertStandard_Old.dat

0:Run
  javascript:script.js
  runbefore: false
  refreshonsave: true

233:TextToWall
path:font.dae
line:no dont give up
thicc:12
size:0.2
animatedefiniteposition:[2,5,25,0]
track:lyrics

244:TextToWall
path:font.dae
line:you will
thicc:12
size:0.2
animatedefiniteposition:[-6,4,30,0]
track:lyrics

251.75:TextToWall
path:font.dae
line:get by
thicc:12
size:0.2
animatedefiniteposition:[9,3,28,0]
track:lyrics

265:TextToWall
path:font.dae
line:the tide is turning
thicc:12
size:0.2
animatedefiniteposition:[3,5,25,0]
track:lyrics

275.75:TextToWall
path:font.dae
line:i feel
thicc:12
size:0.2
animatedefiniteposition:[9,3,30,0]
track:lyrics

283.5:TextToWall
path:font.dae
line:alright
thicc:12
size:0.2
animatedefiniteposition:[-6,4,30,0]
track:lyrics

322:AnimateTrack
track:particle
duration:1
animatedissolve:[1,0],[0,1]

70:AnimateTrack
track:rotatingLasers
duration:0
animatescale:[0.1,1,1,0]