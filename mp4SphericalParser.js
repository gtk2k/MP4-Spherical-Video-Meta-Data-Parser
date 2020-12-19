
class Reader {
    constructor(data,decoder) {
        this.decoder = decoder;
        this.buffer = data.buffeer || data;
        this.dv = new DataView(this.buffer);
        this.offset = 0;
    }

    ui8() {
        const val = this.dv.getUint8(this.offset);
        this.offset += 1;
        return val;
    }

    ui16() {
        const val = this.dv.getUint16(this.offset);
        this.offset += 2;
        return val;
    }

    ui32() {
        const val = this.dv.getUint32(this.offset);
        this.offset += 4;
        return val;
    }

    ui64() {
        const val = this.dv.getBigUint64(this.offset);
        this.offset += 8;
        return val;
    }

    f32() {
        const val = this.dv.getFloat32(this.offset);
        this.offset += 4;
        return val;
    }

    t(len = 4) {
        const data = new Uint8Array(this.buffer, this.offset, len);
        const type = this.decoder.decode(data);
        this.offset += len;
        return type;
    }

    readUserType() {
        const userType = new Uint8Array(this.buffer, this.offset, 16);
        this.offset += 16;
        return userType;
    }

    readData(size) {
        const data = new Uint8Array(this.buffer, this.offset, size);
        this.offset += size;
        return data;
    }

    readBitsArray(arrayLength, cnt, subCnt = 1) {
        const bits = Math.ceil(Math.log2(cnt * 2))
        const rex = new RegExp(`.\{1,${bits}\}`, 'g');
        const byteLength = Math.ceil(arrayLength * bits * subCnt / 8);
        return [...this.readData(byteLength)]
            .map(x => x.toString(2).padStart(8, '0'))
            .join('')
            .match(rex)
            .map(x => {
                let v = parseInt(x, 2);
                return v & 1 ? -(v >> 1) - 1 : (v >> 1);
            });
    }
}

export default class MP4SphericalParser {
    constructor() {
        this.decoder = new TextDecoder();
        this.domParser = new DOMParser();
        this.xmlSerializer = new XMLSerializer();
        this.v1UserType = new Uint8Array([0xff, 0xcc, 0x82, 0x63, 0xf8, 0x55, 0x4a, 0x93, 0x88, 0x14, 0x58, 0x7a, 0x02, 0x52, 0x1f, 0xdd]);
        this.v1 = null;
        this.v2 = null;
        this.atomTypes = [
            'ftyp', 'pdin', 'moov', 'mvhd', 'trak', 'tkhd', 'tref', 'trgr', 'edts', 'elst',
            'mdia', 'mdhd', 'hdlr', 'minf', 'vmhd', 'smhd', 'hmhd', 'nmhd', 'dinf', 'dref',
            'stbl', 'stsd', 'avc1', 'avcC', 'stts', 'ctts', 'cslg', 'stsc', 'stsz', 'stz2',
            'stco', 'co64', 'stss', 'stsh', 'padb', 'stdp', 'sdtp', 'sbgp', 'sgpd', 'subs',
            'saiz', 'saio', 'udta', 'meta', 'hdlr', 'ilst', 'mvex', 'mehd', 'trex', 'leva',
            'moof', 'mfhd', 'traf', 'tfhd', 'trun', 'sbgp', 'sgpd', 'subs', 'saiz', 'saio',
            'tfdt', 'mfra', 'tfra', 'mfro', 'mdat', 'free', 'skip', 'udta', 'cprt', 'tsel',
            'strk', 'stri', 'strd', 'meta', 'hdlr', 'dinf', 'dref', 'iloc', 'ipro', 'sinf',
            'frma', 'schm', 'schi', 'iinf', 'xml ', 'bxml', 'pitm', 'fiin', 'paen', 'fire',
            'fpar', 'fecr', 'segr', 'gitn', 'idat', 'iref', 'meco', 'mere', 'styp', 'sidx',
            'ssix', 'prft', 'iods', 'uuid', 'mp4a', 'st3d', 'sv3d', 'svhd', 'proj', 'prhd',
            'cbmp', 'equi', 'mshp', 'mesh', 'ytmp', 'camm', '�TIM', '�TSC', '�TSZ', '�nam',
            '�ART', 'aART', '�wrt', '�alb', '�day', '�too', '�gen', '�cpy', 'trkn', 'data'
        ];
    
        this.typeNames = [
            '3gp5', 'adda', 'alou', 'also', 'alst', 'assp', 'atom', 'auvd', 'auxv', 'avc1',
            'bitr', 'btrt', 'bxml', 'ccid', 'cdec', 'cdsc', 'cgsc', 'chnl', 'cinf', 'clap',
            'co64', 'colr', 'cprt', 'cslg', 'ctts', 'dimm', 'dinf', 'dmax', 'dmed', 'dmix',
            'dref', 'drep', 'edts', 'elng', 'elst', 'enca', 'encv', 'extr', 'fdel', 'fdp ',
            'fdpa', 'fdsa', 'fdsm', 'feci', 'fecr', 'fgsc', 'fiin', 'file', 'fire', 'font',
            'fpar', 'frar', 'free', 'frma', 'ftyp', 'gitn', 'hdlr', 'hind', 'hinf', 'hint',
            'hmhd', 'hnti', 'icpv', 'idat', 'iinf', 'iloc', 'infe', 'ipro', 'iref', 'iso2',
            'iso3', 'iso4', 'iso5', 'iso6', 'iso7', 'iso8', 'iso9', 'isom', 'istm', 'kind',
            'leva', 'ludt', 'maxr', 'mdat', 'mdhd', 'mdia', 'meco', 'mehd', 'mela', 'mere',
            'meta', 'mett', 'metx', 'mfhd', 'mfra', 'mfro', 'mime', 'minf', 'moof', 'moov',
            'mp41', 'mp42', 'mp4a', 'mp4v', 'mp71', 'mp7b', 'mp7t', 'mpsz', 'msrc', 'mtyp',
            'mvex', 'mvhd', 'name', 'nclx', 'nmhd', 'npck', 'null', 'nump', 'nvws', 'padb',
            'paen', 'pasp', 'payt', 'pdin', 'pitm', 'pm2t', 'pmax', 'prft', 'prof', 'prol',
            'prtp', 'rICC', 'rap ', 'rash', 'rcsr', 'resc', 'resv', 'rinf', 'rm2t', 'roll',
            'rrtp', 'rsrp', 'rssr', 'rtcp', 'rtp ', 'rtpo', 'rtpx', 'saio', 'saiz', 'sap ',
            'sbgp', 'sbtt', 'schi', 'schm', 'scsz', 'sdp ', 'sdtp', 'segr', 'sgpd', 'sidx',
            'sinf', 'skip', 'sm2t', 'smhd', 'snro', 'soun', 'spsc', 'srat', 'sroc', 'srpp',
            'srtp', 'ssix', 'stbl', 'stco', 'stcp', 'stdp', 'sthd', 'stpp', 'strd', 'stri',
            'strk', 'stsc', 'stsd', 'stsg', 'stsh', 'stss', 'stsz', 'stts', 'stvi', 'stxt',
            'styp', 'stz2', 'subs', 'subt', 'sync', 'tOD ', 'tPAT', 'tPMT', 'tele', 'tesc',
            'text', 'tfdt', 'tfhd', 'tfra', 'tims', 'tkhd', 'tlou', 'tmax', 'tmin', 'totl',
            'tpay', 'tpyl', 'traf', 'trak', 'tref', 'trep', 'trex', 'trgr', 'trpy', 'true',
            'trun', 'tsel', 'tsro', 'tssy', 'tsti', 'txtC', 'type', 'udta', 'uri ', 'uriI',
            'urim', 'url ', 'urn ', 'uuid', 'vdep', 'vide', 'vmhd', 'vplx', 'vwsc', 'walk',
            'warp', 'wrap', 'xml ', 'st3d', 'sv3d', 'svhd', 'proj', 'prhd', 'cbmp', 'equi',
            'mshp', 'mesh', 'camm', '�TIM', '�TSC', '�TSZ', '�nam', '�ART', 'aART', '�wrt',
            '�alb', '�day', '�too', '�gen', '�cpy', 'trkn', 'data'
        ];
    
        this.fullBoxTypes = [
            'pdin', 'mvhd', 'tkhd', 'mdhd', 'hdlr', 'nmhd', 'elng', 'stsd', 'stdp', 'stts', 'ctts', 'cslg', 'stss', 'stsh', 'sdtp',
            'elst', 'url ', 'urn ', 'dref', 'stsz', 'stz2', 'stsc', 'stco', 'co64', 'padb', 'subs', 'saiz', 'saio', 'mehd', 'trex',
            'mfhd', 'tfhd', 'trun', 'tfra', 'mfro', 'tfdt', 'leva', 'trep', 'assp', 'sbgp', 'sgpd', 'cprt', 'tsel', 'kind', 'meta',
            'xml ', 'bxml', 'iloc', 'pitm', 'ipro', 'infe', 'iinf', 'mere', 'iref', 'schm', 'fiin', 'fpar', 'fecr', 'gitn', 'fire',
            'stri', 'stsg', 'stvi', 'sidx', 'ssix', 'prft', 'srpp', 'vmhd', 'smhd', 'srat', 'chnl', 'dmix', 'txtC', 'uri ', 'uriI',
            'hmhd', 'sthd', 'st3d', 'svhd', 'prhd', 'cbmp', 'equi', 'mshp', 'ytmp'
        ];
    
        this.parentTypes = [
            'moov', 'trak', 'edts', 'mdia', 'minf', 'dinf', 'stbl', 'stsd', 'avc1', 'udta', 'mvex', 'moof', 'traf', 'mfra', 'skip',
            'cprt', 'strk', 'meta', 'ilst', 'ipro', 'sinf', 'fiin', 'paen', 'meco', 'sv3d', 'proj',
            '�nam', '�ART', 'aART', '�wrt', '�alb', '�day', '�too', '�gen', '�cpy', 'trkn'
        ];
    
        this.sphericalTypes = [
            /*'st3d', 'sv3d',*/ 'svhd', /*'proj'*/, 'prhd', 'cbmp', 'equi', 'mshp', 'mesh', 'camm'
        ];
    
        this.LoudnessBaseBoxTypes = ['tlou', 'alou'];
    
    }

    async parse(url) {
        const res = await fetch(url);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let pos = 0n;
        let dlPos = 0n;
        let prev = null;
        let type = '';
        let sphericalBoxLength = 0n;
        let chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const vLen = BigInt(value.byteLength);
            //console.log(`vLen:${vLen}`);
            dlPos += vLen;
            if ((pos + 16n) > dlPos) {
                prev = value;
                if (sphericalBoxLength) {
                    chunks.push(value);
                }
                continue;
            }
            const pLen = prev ? BigInt(prev.byteLength) : 0n;
            const chunk = Uint8Array.from([...(prev || []), ...value]);
            while ((pos + 16n) <= dlPos) {
                let p = Number(vLen - (dlPos - pos) + pLen);
                if (sphericalBoxLength) {
                    chunks.push(value);
                    let blob = new Blob(chunks);
                    let buffer = await blob.arrayBuffer();
                    let boxData = buffer.slice(0, Number(sphericalBoxLength));
                    let reader = new Reader(boxData, this.decoder);
                    if (type === 'uuid') type = 'parseV1';
                    this[type](reader);
                    chunks = blob = buffer = boxData = reader = null;
                    sphericalBoxLength = 0n;
                }
                type = decoder.decode(chunk.subarray(p + 4, p + 8));
                if (!this.atomTypes.includes(type)) {
                    console.error(`stop parser, encount unknown type:${type}.`);
                    debugger;
                    return;
                }
                console.log(type);
                if (type === 'st3d' || type === 'sv3d') {
                    this.v2 ||= {};
                }
                let len =
                    (BigInt(chunk[p + 0]) << 24n) +
                    (BigInt(chunk[p + 1]) << 16n) +
                    (BigInt(chunk[p + 2]) << 8n) +
                    (BigInt(chunk[p + 3]) << 0n);
                if (len === 1n) {
                    len =
                        (BigInt(chunk[p + 8]) << 56n) +
                        (BigInt(chunk[p + 9]) << 48n) +
                        (BigInt(chunk[p + 10]) << 40n) +
                        (BigInt(chunk[p + 11]) << 32n) +
                        (BigInt(chunk[p + 12]) << 24n) +
                        (BigInt(chunk[p + 13]) << 16n) +
                        (BigInt(chunk[p + 14]) << 8n) +
                        (BigInt(chunk[p + 15]) << 0n);
                } else if (len === 0n) {
                    return;
                }
                if (this.sphericalTypes.includes(type)) {
                    if (BigInt(chunk.byteLength) > (BigInt(p) + len)) {
                        const reader = new Reader(chunk.buffer.slice(p + 12, p + Number(len)), this.decoder);
                        console.log(`this.${type}`);
                        this[type](reader);
                    } else {
                        sphericalBoxLength = len;
                        chunks = [chunk.subarray(p + 12)];
                    }
                } else if (type === 'uuid') {
                    if ([...new Uint8Array(chunk.buffer.slice(p + 8, p + 24))].every((x, i) => x === this.v1UserType[i])) {
                        if (BigInt(chunk.byteLength) > (BigInt(p) + len)) {
                            const reader = new Reader(chunk.buffer.slice(p + 24, p + Number(len)), this.decoder);
                            this.parseV1(reader);
                        } else {
                            sphericalBoxLength = len - 24n;
                            chunks = [chunk.subarray(p + 24)];
                        }
                    }
                }
                if (this.parentTypes.includes(type)) {
                    if (this.fullBoxTypes.includes(type)) {
                        if (type === 'stsd') {
                            pos += 16n;
                        } else {
                            pos += 12n;
                        }
                    } else if (type === 'avc1') {
                        pos += 86n;
                    } else {
                        pos += 8n;
                    }
                } else {
                    pos += len;
                }
            }
            prev = value;
        }
    }

    parseV1(reader) {
        const sphericalVideoV1Xml = reader.t(reader.buffer.byteLength);
        // const sphericalVideoV1Xml = this.decoder.decode(data);
        const doc = this.domParser.parseFromString(sphericalVideoV1Xml, 'text/xml');
        /*
        <?xml version="1.0"?>
        <rdf:SphericalVideo xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
            xmlns:GSpherical="http://ns.google.com/videos/1.0/spherical/">
            <GSpherical:Spherical>true</GSpherical:Spherical>
            <GSpherical:Stitched>true</GSpherical:Stitched>
            <GSpherical:StitchingSoftware>Spherical Metadata Tool</GSpherical:StitchingSoftware>
            <GSpherical:ProjectionType>equirectangular</GSpherical:ProjectionType>
        </rdf:SphericalVideo>
        */
        this.v1 = {
            Spherical: true,
            Stitched: true,
            StitchingSoftware: ',',
            ProjectionType: 'equirectangular',
            StereoMode: 'mono', // 'mono', 'left-right', 'top-bottom'
            SourceCount: 0,
            InitialViewHeadingDegrees: 0,
            InitialViewPitchDegrees: 0,
            InitialViewRollDegrees: 0,
            Timestamp: 0,
            FullPanoWidthPixels: 0,
            FullPanoHeightPixels: 0,
            CroppedAreaImageWidthPixels: 0,
            CroppedAreaImageHeightPixels: 0,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0
        };
        const root = doc.firstChild;
        [...root.children].forEach(x => {
            const val = x.textContent;
            const name = x.tagName.replace('GSpherical:', '');
            if (['true', 'false'].includes(val)) {
                this.v1[name] = val === 'true'
            } else if (/^[0-9]+$/.test(val)) {
                this.v1[name] = +val;
            } else {
                this.v1[name] = val;
            }
        });
    }

    st3d(reader) {
        this.v2.stereo_mode = reader.ui8();
    }

    svhd(reader) {
        this.v2.metadata_source = this.decoder.decode(reader.buffer);
    }

    prhd(reader) {
        this.v2.pose_yaw_degrees = reader.ui32();
        this.v2.pose_pitch_degrees = reader.ui32();
        this.v2.pose_roll_degrees = reader.ui32();
    }

    cbmp(reader) {
        this.v2.proj_type = 'cbmp';
        this.v2.layout = reader.ui32();
        this.v2.padding = reader.ui32();
    }

    equi(reader) {
        this.v2.proj_type = 'equi';
        this.v2.projection_bounds_top = reader.ui32();
        this.v2.projection_bounds_bottom = reader.ui32();
        this.v2.projection_bounds_left = reader.ui32();
        this.v2.projection_bounds_right = reader.ui32();
    }

    mshp(reader) {
        this.v2.proj_type = 'mshp';
        const crc = reader.ui32();
        const encodingForCC = reader.t();
        let meshData = reader.readData(reader.buffer.byteLength - 8);
        if (encodingForCC === 'dfl8') {
            meshData = pako.inflateRaw(meshData);
        } else if (encodingForCC !== 'raw ') {
            throw 'unknown mesh encoding ForCC';
        }
        const meshReader = new Reader(meshData.buffer, this.decoder);
        const meshes = [];
        while (meshReader.offset < meshData.byteLength) {
            const boxSize = meshReader.ui32();
            const boxType = meshReader.t();
            const coordinate_count = meshReader.ui32() & 0x7FFFFFFF;
            const cordinates = [];
            for (let i = 0; i < coordinate_count; i++) {
                cordinates.push(meshReader.f32());
            }
            const vertex_count = meshReader.ui32() & 0x7FFFFFFF;
            const vertices = [];
            let tmp = meshReader.readBitsArray(vertex_count, coordinate_count, 5);
            for (let i = 0; i < vertex_count; i++) {
                vertices.push({
                    x_index_delta: tmp[i * 5 + 0],
                    y_index_delta: tmp[i * 5 + 1],
                    z_index_delta: tmp[i * 5 + 2],
                    u_index_delta: tmp[i * 5 + 3],
                    v_index_delta: tmp[i * 5 + 4]
                });
            }
            const vertex_list_count = meshReader.ui32() & 0x7FFFFFFF;
            const vertex_list = [];
            for (let i = 0; i < vertex_list_count; i++) {
                const texture_id = meshReader.ui8();
                const index_type = meshReader.ui8();
                const index_count = meshReader.ui32() & 0x7FFFFFFF;
                const index_as_delta = meshReader.readBitsArray(index_count, vertex_count);
                vertex_list.push({
                    texture_id,
                    index_type,
                    index_count,
                    index_as_delta
                });
            }
            meshes.push({
                cordinates,
                vertices,
                vertex_list
            });
        }
        this.v2.meshes = meshes;
    }

    // VR180(VR180に限らない？)用の拡張ボックス
    // https://developers.google.com/streetview/publish/camm-spec
    camm() {
        // TODO
    }

    generateThreeJSMesh(THREE, video) {
        const stereoMode = this.v2.stereo_mode;
        const meshes = this.v2.meshes;
        const threejsMeshes = meshes.map((meshData, mi) => {
            let xi = 0, yi = 0, zi = 0, ui = 0, vi = 0, ii = 0;
            const vertices = [];
            const indexes = [];
            const uvs = [];
            meshData.vertices.forEach(ver => {
                xi += ver.x_index_delta;
                yi += ver.y_index_delta;
                zi += ver.z_index_delta;
                ui += ver.u_index_delta;
                vi += ver.v_index_delta;
                let x = meshData.cordinates[xi];
                let y = meshData.cordinates[yi];
                let z = meshData.cordinates[zi];
                let u = meshData.cordinates[ui];
                let v = meshData.cordinates[vi];
                if (stereoMode === 2) {
                    u = mi === 0 ? u * 0.5 : u * 0.5 + 0.5;
                } else if (stereoMode === 4) {
                    u = mi === 0 ? u * 0.5 + 0.5 : u * 0.5;
                }
                if (stereoMode === 1) {
                    v = mi === 0 ? v * 0.5 : v * 0.5 + 0.5;
                }
                vertices.push(new THREE.Vector3(x, y, z));
                uvs.push(new THREE.Vector2(u, v));
            });
            meshData.vertex_list[0].index_as_delta.forEach(idxDelta => {
                ii += idxDelta;
                indexes.push(ii);
            });

            const geometry = new THREE.Geometry();
            geometry.vertices = vertices;
            for (let i = 0; i < indexes.length - 2; i++) {
                if ((i & 1) != 0) {
                    geometry.faces.push(new THREE.Face3(indexes[i + 1], indexes[i + 2], indexes[i]));
                    geometry.faceVertexUvs[0].push([uvs[indexes[i + 1]], uvs[indexes[i + 2]], uvs[indexes[i]]]);
                    // unityIndicies.Add(indicies[i + 1]);
                    // unityIndicies.Add(indicies[i + 2]);
                    // unityIndicies.Add(indicies[i]);
                }
                else {
                    geometry.faces.push(new THREE.Face3(indexes[i + 2], indexes[i + 1], indexes[i]));
                    geometry.faceVertexUvs[0].push([uvs[indexes[i + 2]], uvs[indexes[i + 1]], uvs[indexes[i]]]);
                }
            }
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            geometry.verticesNeedUpdate = true;
            geometry.uvsNeedUpdate = true;
            const videoTexture = new THREE.VideoTexture(video);
            const material = new THREE.MeshBasicMaterial({ map: videoTexture, color: 'white', side: THREE.DoubleSide });
            const threejsMesh = new THREE.Mesh(geometry, material);
            return threejsMesh;
        });
        return threejsMeshes;
    }
}


