# ScuffedWalls v2.1.0

# Documentation on functions can be found at
# https://github.com/thelightdesigner/ScuffedWalls/blob/main/Functions.md
            
# DM @thelightdesigner#1337 for more help?

# Using this tool requires an understanding of Noodle Extensions.
# https://github.com/Aeroluna/Heck/wiki

# Playtest your maps

Workspace:Default


0: Import
   Path:ExpertPlusStandard_Old.dat

0:Run
  Script:script.ts
  RunBefore: false
  RefreshOnSave: true

0:ModelToWall
  Path:mainSwirl.dae
  Track:mainSwirl
  Type:3

0:ModelToWall
  Path:altSwirl.dae
  Track:altSwirl
  Type:3

0:ModelToWall
  Path:topSwirl.dae
  Track:
  Type:3

0:ModelToWall
  Path:bottomSwirl.dae
  Track:
  Type:3

0:ModelToWall
  Path:lasers.dae
  Track:lasers
  Type:3