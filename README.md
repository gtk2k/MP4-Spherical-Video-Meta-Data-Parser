# MP4-Spherical-Video-Meta-Data-Parser
MP4 Spherical Video V1 / V2 Meta Data Parser

* Parsing with ReadableStream
* Supports files larger than 4GB by using BigInt

## Known issues
* If a large Box, such as the 'mdat' Box(Atom), precedes the metadata, it will take longer to parse.
