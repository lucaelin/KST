# KST - Kerbal Space Tracking
A Mobile Web App for KSP telemetry data

Ever wanted to check how your Kerbals are doing while going to the Gym? No? Anyway...
KST lets you connect your phone or browser to the game running on another device.
It uses the KRPC-Mod to steam realtime-information of your craft in orbit.

## How to
1) Add the KRPC-Mod to your Kerbal Space Program installation
2) Configure the KRPC-Mod to use `Protobuf over WebSockets` as Protocol (and change ip and port if necessary)
3) Start the KRPC-server
4) Open [KST on js.org](http://kst.js.org/)
5) Enter the servers connection data into the App and connect!

## Screenshots
### In-Flight data
![KST Orbit webapp preview][orbit]

### Managing Crafts
![KST Vessels webapp preview][vessel]

## Video
[![Kerbal Space Tracking][youtube]](http://www.youtube.com/watch?v=fOfCDa4lcqY "Kerbal Space Tracking")

[youtube]: http://img.youtube.com/vi/fOfCDa4lcqY/0.jpg
[orbit]: https://github.com/lucaelin/KST/raw/master/preview/orbitinfo.png "KST Orbit webapp preview"
[vessel]: https://github.com/lucaelin/KST/raw/master/preview/vessels.png "KST Vessels webapp preview"
