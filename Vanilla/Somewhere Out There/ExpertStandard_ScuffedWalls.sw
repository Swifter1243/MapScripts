# ScuffedWalls v1.5.1-dev

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
javascript:script_expert.js
runbefore: false
refreshonsave: true

0:ModelToWall
path:shore.dae
track:shore
type:3

0:ModelToWall
path:foggy_mountain.dae
track:foggy_mountain
type:3

0:ModelToWall
path:monoliths.dae
track:monoliths
type:3

0:ModelToWall
path:forest.dae
track:forest
type:3

0:ModelToWall
path:mountains.dae
track:mountains
type:3

0:ModelToWall
path:horizon.dae
track:horizon
type:3

0:ModelToWall
path:intro.dae
type:3

0:ModelToWall
path:drop1.dae
type:3

0:ModelToWall
path:drop2.dae
type:3

0:ModelToWall
path:drop3.dae
type:3

## Start: 262, Dur: 192
263:Wall
njsoffset:-20
njs:0
animatedissolve:[0,0],[1,0],[1,1],[0,1]
scale:[2000,0.5,2000]
animatedefiniteposition:[-1000,0,{-1000 + 500},0],[-1000,0,{-960 + 500},1]
color:[0,1.5,2,10]
duration:190
interactable:false
track:environment

## Start: 710, Dur: 114.25
711:Wall
njsoffset:-20
njs:0
animatedissolve:[0,0],[1,0],[1,1],[0,1]
scale:[2000,0.5,2000]
animatedefiniteposition:[-1000,10,{-1000 + 2900},0],[-1000,10,{-960 + 2900},1]
color:[0,1,1.3,30]
duration:112.25
interactable:false
track:environment

## Add 1.75
260.75:TextToWall
njsoffset:-0.5
njs:20
animatedissolve:[0,0],[1,0.05],[1,0.5],[0,1]
animatedefiniteposition:[0,0,0,0]
duration:8
interactable:false
size:0.15
path:acloudyskye_font.dae
line:oh and under
color:[10,10,10,0]
track:lyrics

277.75:TextToWall
njsoffset:-0.5
njs:20
animatedissolve:[0,0],[1,0.05],[1,0.5],[0,1]
animatedefiniteposition:[0,0,0,0]
duration:4
interactable:false
size:0.35
path:acloudyskye_font.dae
line:under we go
color:[10,10,10,0]
track:lyrics

285.1666:TextToWall
njsoffset:-0.5
njs:20
animatedissolve:[0,0],[1,0.05],[1,0.5],[0,1]
animatedefiniteposition:[0,0,0,0]
duration:5
interactable:false
size:0.5
path:acloudyskye_font.dae
line:so far below
color:[10,10,10,0]
track:lyrics

292.75:TextToWall
njsoffset:-0.5
njs:20
animatedissolve:[0,0],[1,0.05],[1,0.5],[0,1]
animatedefiniteposition:[0,0,0,0]
duration:8
interactable:false
size:0.15
path:acloudyskye_font.dae
line:oh and under
color:[10,10,10,0]
track:lyrics

309.75:TextToWall
njsoffset:-0.5
njs:20
animatedissolve:[0,0],[1,0.05],[1,0.5],[0,1]
animatedefiniteposition:[0,0,0,0]
duration:5
interactable:false
size:0.35
path:acloudyskye_font.dae
line:under we go
color:[10,10,10,0]
track:lyrics

317.1666:TextToWall
njsoffset:-0.5
njs:20
animatedissolve:[0,0],[1,0.0420],[1,0.5],[0,1]
animatedefiniteposition:[0,0,0,0]
duration:10
interactable:false
size:0.5
path:acloudyskye_font.dae
line:so far below
color:[10,10,10,0]
track:lyrics

826.25:TextToWall
njsoffset:-0.5
njs:20
animatedissolve:[0,0],[1,0]
animatedefiniteposition:[0,0,0,0]
duration:20
interactable:false
size:0.2
path:acloudyskye_font.dae
line:Somewhere Out There
color:[10,10,10,0]
track:lyrics

#### REDDEK CODE vvvv