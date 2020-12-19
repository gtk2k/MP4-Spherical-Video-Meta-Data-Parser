# MP4-Spherical-Video-Meta-Data-Parser
MP4 Spherical Video V1 / V2 Meta Data Parser.

* Parsing with ReadableStream.
* Supports files larger than 4GB by using BigInt. (Unverified)

## Dependent libraries
* [pako](https://github.com/nodeca/pako)
Using pako to decompress Deflate compression.

## How to use.
```js
import MP4SphericalParser from './mp4SphericalParser.js';

const parser = new MP4SphericalParser();
await parser.parse('v2.mp4');

// get parse result.
const v1 = parser.v1;
const v2 = parser.v2;
```

## Known issues
* If a large Box, such as the 'mdat' Box(Atom), precedes the metadata, it will take longer to parse.

## License
[MIT](https://github.com/gtk2k/MP4-Spherical-Video-Meta-Data-Parser/blob/main/LICENSE)

