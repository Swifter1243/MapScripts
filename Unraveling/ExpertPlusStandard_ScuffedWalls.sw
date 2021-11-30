# ScuffedWalls v1.5.0

# Documentation on functions can be found at
# https://github.com/thelightdesigner/ScuffedWalls/blob/main/Functions.md
            
# DM @thelightdesigner#1337 for more help?

# Using this tool requires an understanding of Noodle Extensions.
# https://github.com/Aeroluna/NoodleExtensions/blob/master/Documentation/AnimationDocs.md

# Playtest your maps

Workspace:Default

0: Import
   Path:ExpertPlusStandard_Old.dat

0:Run
  javascript:script.js
  runbefore: false
  refreshonsave: true

0:ModelToWall
path:nest.dae
duration:400
track:nest
type:3

0:ModelToWall
path:lasers.dae
duration:400
track:lasers
type:3