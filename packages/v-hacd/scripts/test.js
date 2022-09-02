// // import fs from 'fs';
// const fs = require('fs');

// const Ammo = await (await import('./ammo.js')).default()

// const h = new Ammo.AmmoHelpers()

// const a = h.CreateVHACD_ASYNC()

// const contents = fs.readFileSync('../cube.obj', 'utf8').toString();

// const rows = contents.split('\n').filter(Boolean).map(line => line.split(' '))
// const vertices = rows.filter(row => row[0] === 'v').map(row => row.slice(1).map(parseFloat))
// const faces = rows.filter(row => row[0] === 'f').map(row => row.slice(1)).map(row => row.map(cell => parseInt(cell.split('/')[0])))

// // console.log(contents);
// console.log(vertices.length, faces.length);

// const res = a.Compute(vertices, vertices.length, faces, faces.length)
// console.log(res);

// setInterval(() => {
//     console.log('ready', a.IsReady());
//     process.exit(0);
// }, 500);

// import fs from 'fs';
const fs = require("fs");

// import('./ammo.js')
// import("../builds/ammo.wasm.js")
import("../builds/ammo.js")
.then(async (AmmoModule) => {
  console.log('AmmoModule', AmmoModule);
  const Ammo = await AmmoModule.default();
  console.log('Ammo', Ammo);

  const h = new Ammo.AmmoHelpers();
  console.log('helper', h);

  const vhacd = h.CreateVHACD_ASYNC();
  console.log('vhacd', vhacd);

  const contents = fs.readFileSync("../../demo/public/models/cube.obj", "utf8").toString();

  const rows = contents
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split(" "));
  const vertices = rows
    .filter((row) => row[0] === "v")
    .map((row) => row.slice(1).map(parseFloat));
  const faces = rows
    .filter((row) => row[0] === "f")
    .map((row) => row.slice(1))
    .map((row) => row.map((cell) =>
      parseInt(cell.split("/")[0]) - 1
    ));

  // console.log(contents);
  console.log(vertices.length, faces.length);

  const parameters = new Ammo.Parameters();
  const logging = new Ammo.Logging();
  parameters.m_callback = logging;
  // parameters.m_logger = logging;
  // const res = a.Compute(vertices, vertices.length, faces, faces.length, parameters)

  const points = Ammo._malloc(vertices.length * 3 * 8 + 3);
  const triangles = Ammo._malloc(faces.length * 3 * 4);

  let pptr = points / 8,
    tptr = triangles / 4;

  const indexes = faces;
  for (let i = 0; i < vertices.length; i++) {
    const components = vertices[i];
    // matrix.fromArray(matrices[i]);
    for (let j = 0; j < components.length; j += 3) {
      //   vector
      //     .set(components[j + 0], components[j + 1], components[j + 2])
      //     .applyMatrix4(matrix)
      //     .sub(center);
      const vector = {
        x: components[0],
        y: components[1],
        z: components[2],
      };
      Ammo.HEAPF64[pptr + 0] = vector.x;
      Ammo.HEAPF64[pptr + 1] = vector.y;
      Ammo.HEAPF64[pptr + 2] = vector.z;
      pptr += 3;
    }
    if (indexes[i]) {
      const indices = indexes[i];
      for (let j = 0; j < indices.length; j++) {
        Ammo.HEAP32[tptr] = indices[j];
        tptr++;
      }
    } else {
      for (let j = 0; j < components.length / 3; j++) {
        Ammo.HEAP32[tptr] = j;
        tptr++;
      }
    }
  }

  const res = vhacd.Compute(
    points,
    vertices.length,
    triangles,
    faces.length,
    parameters
  );

  console.log(res);
  console.log("ready", vhacd.IsReady());

  function OnReady() {
    const nHulls = vhacd.GetNConvexHulls();
    console.log('Found', nHulls, 'hulls');
    const allHulls = [];

    const ch = new Ammo.ConvexHull();
    for (let i = 0; i < nHulls; i++) {
      vhacd.GetConvexHull(i, ch);
      const nPoints = ch.get_m_nPoints();
      // const hullPoints = ch.get_m_points();
      const hull = [];

      for (let pi = 0; pi < nPoints; pi++) {
        const px = ch.get_m_points(pi * 3 + 0);
        const py = ch.get_m_points(pi * 3 + 1);
        const pz = ch.get_m_points(pi * 3 + 2);
        // hull.addPoint(btVertex, pi === nPoints - 1);
        const vertex = [px, py, pz];
        hull.push(vertex);
      }
      // console.log('Hull', i, hull);
      allHulls.push(hull);
      // shapes.push(finishCollisionShape(hull, options, scale));
    }
    Ammo.destroy(ch);
    Ammo.destroy(vhacd);

    console.log(allHulls);
  }

  const intervalId = setInterval(() => {
    console.log("ready", vhacd.IsReady());
    // process.exit(0);
    if (vhacd.IsReady()) {
      clearInterval(intervalId);
      OnReady();
    }
  }, 500);
});
