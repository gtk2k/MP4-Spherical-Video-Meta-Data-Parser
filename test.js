import MP4SphericalParser from './mp4SphericalParser.js';

class test {
    async test1() {
        let parser = new MP4SphericalParser();
        // await parser.parse('vr180.mp4');
        // console.assert(!parser.v1, 'no v1');
        // console.assert(parser.v2, 'no v2');
        // parser = new MP4SphericalParser();
        // await parser.parse('v2.mp4');
        // console.assert(parser.v1, 'no v1');
        // console.assert(parser.v2, 'no v2');
        await parser.parse('test.m4a');
    }
}

(async _ => {
    const t = new test();
    await t.test1();
})();