const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const SIZE = 512;
const RED = [179, 38, 30];
const WHITE = [255, 255, 255];

const png = new PNG({ width: SIZE, height: SIZE });

function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const leftPage = [
  [92, 132],
  [92, 384],
  [258, 384],
  [212, 132],
];
const rightPage = [
  [420, 132],
  [420, 384],
  [254, 384],
  [300, 132],
];
const spine = [
  [240, 132],
  [246, 132],
  [246, 384],
  [240, 384],
];

function fill(poly, color) {
  const minX = Math.max(0, Math.floor(Math.min(...poly.map((p) => p[0]))));
  const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(...poly.map((p) => p[0]))));
  const minY = Math.max(0, Math.floor(Math.min(...poly.map((p) => p[1]))));
  const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(...poly.map((p) => p[1]))));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (inPolygon(x + 0.5, y + 0.5, poly)) {
        const idx = (SIZE * y + x) << 2;
        png.data[idx] = color[0];
        png.data[idx + 1] = color[1];
        png.data[idx + 2] = color[2];
        png.data[idx + 3] = 255;
      }
    }
  }
}

fill(
  [
    [0, 0],
    [SIZE, 0],
    [SIZE, SIZE],
    [0, SIZE],
  ],
  RED,
);
fill(leftPage, WHITE);
fill(rightPage, WHITE);
fill(spine, [0, 0, 0]);

const buildDir = path.join(__dirname, "..", "build");
fs.mkdirSync(buildDir, { recursive: true });
const outPath = path.join(buildDir, "icon.png");
fs.writeFileSync(outPath, PNG.sync.write(png));
console.log(`wrote ${outPath}`);
