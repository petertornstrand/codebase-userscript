// Generates placeholder PNG icons for the browser extension (a rounded square
// in the Codebase blue). Chrome needs PNG, SVG icons are not supported. Replace
// the files in src/extension/icons with real artwork when there is some.
import { deflateSync } from 'zlib';
import { mkdirSync, writeFileSync } from 'fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});
const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), body.length + 4);
    return out;
};

const png = (size) => {
    const radius = size * 0.2;
    const rows = [];
    for (let y = 0; y < size; y++) {
        const row = Buffer.alloc(1 + size * 4);
        for (let x = 0; x < size; x++) {
            // Distance outside the rounded corner, if any.
            const dx = Math.max(radius - x - 0.5, x + 0.5 - (size - radius), 0);
            const dy = Math.max(radius - y - 0.5, y + 0.5 - (size - radius), 0);
            const inside = Math.hypot(dx, dy) <= radius;
            row.set(inside ? [0x1f, 0x6f, 0xeb, 0xff] : [0, 0, 0, 0], 1 + x * 4);
        }
        rows.push(row);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header.set([8, 6, 0, 0, 0], 8);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(Buffer.concat(rows))),
        chunk('IEND', Buffer.alloc(0)),
    ]);
};

mkdirSync('src/extension/icons', { recursive: true });
for (const size of [16, 32, 48, 128]) {
    writeFileSync(`src/extension/icons/icon-${size}.png`, png(size));
}
