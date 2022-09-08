// import * as VHACDPkg from '../lib/builds/dist/vhacd.dev-threads.wasm.js';
// import { VHACD as VHACDModule } from '../lib/builds/dist/vhacd.dev-threads.wasm.cjs';
// import { VHACD as VHACDModule } from '../lib/builds/dist/vhacd.dev-threads.wasm';
// import { VHACD as VHACDModule } from '../lib/builds/dist/vhacd.dev.threads.wasm.esm';
// import { VHACD as VHACDModule } from '../lib/builds/dist/vhacd.dev.wasm.esm';

// import { VHACD as VHACDModule } from './testing.cjs';
// import VHACDModule from '../lib/builds/dist/vhacd.dev-threads.wasm';
// const { VHACD: VHACDModule } = require('../lib/builds/dist/vhacd.dev-threads.wasm');
// console.log('VHACDModule', VHACDModule);

// const wasmPath = require.resolve('../builds/ammo.wasm.wasm')

// const libPathLookup = (process.env.NODE_ENV === 'production')
// ? {
//   wasm: new URL('../lib/builds/dist/vhacd.prod.wasm.wasm', import.meta.url).href,
// }
// : {
//   wasm: new URL('../lib/builds/dist/vhacd.dev.wasm.wasm', import.meta.url).href,
// };

/*
const libPathLookup = false //(process.env.NODE_ENV === 'production')
  ? {
    js: new URL('../lib/builds/dist/vhacd.prod.threads.esm.js', import.meta.url).href,
    cjs: new URL('../lib/builds/dist/vhacd.prod.threads.js', import.meta.url).href,
    wasmJs: new URL('../lib/builds/dist/vhacd.prod.threads.wasm.esm.js', import.meta.url).href,
    wasmCjs: new URL('../lib/builds/dist/vhacd.dev.threads.wasm.js', import.meta.url).href,
    wasmWasm: new URL('../lib/builds/dist/vhacd.prod.threads.wasm.wasm', import.meta.url).href,
    wasmWorkerJs: new URL('../lib/builds/dist/vhacd.prod.threads.wasm.worker.js', import.meta.url).href,
    workerJs: new URL('../lib/builds/dist/vhacd.prod-threads.worker.js', import.meta.url).href,
  } as const
  : { 
    js: new URL('../lib/builds/dist/vhacd.dev.threads.esm.js', import.meta.url).href,
    cjs: new URL('../lib/builds/dist/vhacd.dev.threads.js', import.meta.url).href,
    wasmJs: new URL('../lib/builds/dist/vhacd.dev.threads.wasm.esm.js', import.meta.url).href,
    // wasmCjs: new URL('../lib/builds/dist/vhacd.dev-threads.wasm.cjs.js', import.meta.url).href,
    wasmCjs: new URL('../lib/builds/dist/vhacd.dev.threads.wasm.js', import.meta.url).href,
    wasmWasm: new URL('../lib/builds/dist/vhacd.dev.threads.wasm.wasm', import.meta.url).href,
    wasmWorkerJs: new URL('../lib/builds/dist/vhacd.dev.threads.wasm.worker.js', import.meta.url).href,
    workerJs: new URL('../lib/builds/dist/vhacd.dev.threads.worker.js', import.meta.url).href,
  } as const;
*/

const libPathLookup = { 
  js: new URL('../lib/builds/dist/vhacd.dev.esm.js', import.meta.url).href,
  cjs: new URL('../lib/builds/dist/vhacd.dev.js', import.meta.url).href,
  wasmJs: new URL('../lib/builds/dist/vhacd.dev.wasm.esm.js', import.meta.url).href,
  wasmCjs: new URL('../lib/builds/dist/vhacd.dev.wasm.js', import.meta.url).href,
  wasmWasm: new URL('../lib/builds/dist/vhacd.dev.wasm.wasm', import.meta.url).href,
  wasmWorkerJs: new URL('../lib/builds/dist/vhacd.dev.wasm.worker.js', import.meta.url).href,
  workerJs: new URL('../lib/builds/dist/vhacd.dev.worker.js', import.meta.url).href,
} as const;

// const wasmPath = (process.env.NODE_ENV === 'production')
//   ? new URL('../lib/builds/dist/vhacd.prod.wasm.wasm', import.meta.url).href
//   : new URL('../lib/builds/dist/vhacd.dev.wasm.wasm', import.meta.url).href
//   ;
// console.log('wasmPath', wasmPath);

console.log('libPathLookup', libPathLookup);

type MODE = "WASM" | "JS";
// const MODE: MODE = "WASM"; //'JS'

export interface Options {
  mode?: MODE;
}

export type Vertex = [x: number, y: number, z: number];
export type ConvexHull = Vertex[];

export interface ComputeParameters {
  /**
   * The maximum number of convex hulls to produce
   * Default = 64
   */
  maxConvexHulls: number;
  /**
   * The voxel resolution to use
   * Default = 400000
   */
  resolution: number;
  /**
   * if the voxels are within 1% of the volume of the hull, we consider this a close enough approximation
   * Default = 1
   */
  minimumVolumePercentErrorAllowed: number;
  /**
   * The maximum recursion depth
   * Default = 12
   */
  maxRecursionDepth: number;
  /**
   * The maximum number of vertices allowed in any output convex hull
   * Default = 64
   */
  maxNumVerticesPerCH: number;
  /**
   * Once a voxel patch has an edge length of less than 4 on all 3 sides, we don't keep recursing
   * Default = 2
   */
  minEdgeLength: number;
  /**
   * Whether or not to shrinkwrap the voxel positions to the source mesh on output
   * true
   */
  shrinkWrap: boolean;
  /**
   * Whether or not to attempt to split planes along the best location. Experimental feature. False by default.
   * Default = false
   */
  findBestPlane: boolean;
}

export interface ComputeOptions extends Partial<ComputeParameters> {
  vertices: any[];
  faces: any[];
}


export interface ComputeResult {
  hulls: ConvexHull[];
  timing: {
    total: number;
  };
}

export class VHACD {
  private modulePromise: Promise<any>;
  private vhacdInstancePromise: Promise<any>;

  constructor(options: Options = {}) {
    this.modulePromise = loadModule(options);
    this.vhacdInstancePromise = this.createInstance();
  }

  public async compute({
    vertices = [],
    faces = [],
    ...params
  }: ComputeOptions): Promise<ComputeResult> {
    const Ammo = await this.modulePromise;
    const vhacd = await this.vhacdInstancePromise;

    // const vhacd = h.CreateVHACD_ASYNC();
    // const vhacd = h.CreateVHACD();
    console.log("vhacd", vhacd);

    // console.log(contents);
    console.log("Model", vertices.length, faces.length);
    console.log("Model", { vertices, faces });

    const parameters = new Ammo.Parameters();
    const logging = new Ammo.Logging();
    parameters.m_callback = logging;

    if (params.maxConvexHulls) {
      parameters.set_m_maxConvexHulls(params.maxConvexHulls) //maxConvexHulls;
    }
    if (params.resolution) {
      parameters.set_m_resolution(params.resolution); //10000000; //10000000;
    }
    if (params.minimumVolumePercentErrorAllowed) {
      parameters.set_m_minimumVolumePercentErrorAllowed(params.minimumVolumePercentErrorAllowed); //0;//0.01;
    }
    if (params.maxRecursionDepth) {
      parameters.set_m_maxRecursionDepth(params.maxRecursionDepth); //0;//0.01;
    }
    // parameters.m_resolution = 100000; //10000000; //10000000;
    // parameters.m_minimumVolumePercentErrorAllowed = 1; //0;//0.01;

    // parameters.set_m_maxConvexHulls(maxConvexHulls);
    // parameters.set_m_resolution(100000); //10000000; //10000000;
    // parameters.set_m_minimumVolumePercentErrorAllowed(1); //0;//0.01;

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

    console.log(
      "Compute",
      points,
      vertices.length,
      triangles,
      faces.length,
      parameters
    );
    const startTime = Date.now();
    const res = vhacd.Compute(
      points,
      vertices.length,
      triangles,
      faces.length,
      parameters
    );
    console.log("res", res);
    if (!res) {
      return Promise.reject(new Error("Compute failed."));
    }
    return this.postCompute({
      startTime,
      Ammo,
      vhacd,
    });
  }

  private createInstance() {
    return this.modulePromise.then(async (Ammo) => {
      const h = new Ammo.VHACDHelpers();
      console.log("helper", h);

      // const vhacd = h.CreateVHACD_ASYNC();
      const vhacd = h.CreateVHACD();
      return vhacd;
    });
  }

  protected async postCompute({
    startTime,
    Ammo,
    vhacd,
  }: any): Promise<ComputeResult> {
    return new Promise<ComputeResult>((resolve, reject) => {
      console.log("ready", vhacd.IsReady());

      const OnReady = () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log("Time", duration / 1000, " seconds");

        const hulls = this.getConvexHulls(Ammo, vhacd);

        const result: ComputeResult = {
          timing: {
            total: duration,
          },
          hulls,
        };
        resolve(result);
      };

      if (vhacd.IsReady()) {
        OnReady();
        return;
      }

      const intervalId = setInterval(() => {
        console.log("ready", vhacd.IsReady());
        // process.exit(0);
        if (vhacd.IsReady()) {
          clearInterval(intervalId);
          OnReady();
        }
      }, 100);
    });
  }

  private getConvexHulls(Ammo: any, vhacd: any): ConvexHull[] {
    const nHulls = vhacd.GetNConvexHulls();
    console.log("Found", nHulls, "hulls");
    const allHulls: ConvexHull[] = [];

    const ch = new Ammo.ConvexHull();
    for (let i = 0; i < nHulls; i++) {
      vhacd.GetConvexHull(i, ch);
      const nPoints = ch.get_m_nPoints();
      // const hullPoints = ch.get_m_points();
      const hull: ConvexHull = [];

      for (let pi = 0; pi < nPoints; pi++) {
        const px = ch.get_m_points(pi * 3 + 0);
        const py = ch.get_m_points(pi * 3 + 1);
        const pz = ch.get_m_points(pi * 3 + 2);
        // hull.addPoint(btVertex, pi === nPoints - 1);
        const vertex: Vertex = [px, py, pz];
        hull.push(vertex);
      }
      // console.log('Hull', i, hull);
      allHulls.push(hull);
      // shapes.push(finishCollisionShape(hull, options, scale));
    }
    Ammo.destroy(ch);
    Ammo.destroy(vhacd);

    console.log(allHulls);
    return allHulls;
  }
}

async function loadModule(options: Options = {}) {
  const { mode = 'WASM' } = options;
  // const modulePromise =
  //   MODE === "WASM"
  //     ? (
  //       (process.env.NODE_ENV === 'production')
  //       ? import("../lib/builds/dist/vhacd.prod.wasm.js")
  //       : import("../lib/builds/dist/vhacd.dev.wasm.js")
  //     )
  //     : (
  //       (process.env.NODE_ENV === 'production')
  //       ? import("../lib/builds/dist/vhacd.prod.js")
  //       : import("../lib/builds/dist/vhacd.dev.js")
  //     );
  // const modulePromise =
  //   MODE === "WASM"
  //     ? (
  //       (process.env.NODE_ENV === 'production')
  //       ? import("../lib/builds/dist/vhacd.prod-threads.wasm.js")
  //       : import("../lib/builds/dist/vhacd.dev-threads.wasm.js")
  //     )
  //     : (
  //       (process.env.NODE_ENV === 'production')
  //       ? import("../lib/builds/dist/vhacd.prod-threads.js")
  //       : import("../lib/builds/dist/vhacd.dev-threads.js")
  //     );

  // const modulePromise = import(libPathLookup.js);

  // const modulePromise = import('../lib/builds/dist/vhacd.dev-threads.wasm.js');
  // const modulePromise = import('../lib/builds/dist/vhacd.dev.threads.wasm.esm.js');

  // const modulePromise = import(
  //   MODE === 'WASM'
  //   ? libPathLookup.wasmJs
  //   : libPathLookup.js
  // );

  // const modulePromise = mode === 'WASM'
  //   ? import('../lib/builds/dist/vhacd.dev.threads.wasm.esm.js')
  //   : import('../lib/builds/dist/vhacd.dev.threads.esm.js')
  //   ;
  const modulePromise = mode === 'WASM'
    ? import('../lib/builds/dist/vhacd.dev.wasm.esm.js')
    : import('../lib/builds/dist/vhacd.dev.esm.js')
    ;

  /*
  const libBlobLookup = Object.fromEntries(await Promise.all(
    Array.from(Object.entries(libPathLookup))
      .map(async ([key, val]) => {
        const blob = await fetch(val).then(res => res.blob());
        return Promise.resolve([key, blob]);
      })
  ));
  console.log('libBlogLookup', libBlobLookup);
  */

  return modulePromise.then(async (AmmoModule) => {
    // console.log("AmmoModule", AmmoModule, AmmoModule.default);
    const Ammo = await AmmoModule.default({
      // INITIAL_MEMORY: MODE === "JS" ? 5242880 * 2 : undefined,
      // INITIAL_MEMORY: 5242880 * 2,
      // INITIAL_MEMORY: 10 * 1024 * 1024,
      // WebAssembly.instantiate(): 
      // memory import 25 is smaller than initial 32768, got 160
      INITIAL_MEMORY: mode === 'JS' ? 100 * 1024 * 1024 : undefined,
      // INITIAL_MEMORY: 25 * 1024 * 1024,
      // memory import 25 is smaller than initial 32768, got 1600)
      // TOTAL_MEMORY: 300 * 1024 * 1024,
      // mainScriptUrlOrBlob: "/vhacd/ammo.js",
      // mainScriptUrlOrBlob: libPathLookup.js,
      // mainScriptUrlOrBlob: libPathLookup.wasmJs,
      // mainScriptUrlOrBlob: libPathLookup.wasmCjs,
      mainScriptUrlOrBlob: mode === 'WASM' ? libPathLookup.wasmCjs : libPathLookup.cjs,
      // mainScriptUrlOrBlob: mode === 'WASM' ? libBlobLookup.wasmCjs : libBlobLookup.cjs,
      __emscripten_thread_crashed: (error: Error) => {
        console.error("__emscripten_thread_crashed", error);
      },
      locateFile: function (s: string) {
        console.log("locateFile", s);
        if (s.endsWith('.wasm.wasm')) {
          // return wasmPath;
          return libPathLookup.wasmWasm;
          // return libBlobLookup.wasmWasm;
        } else if (s.endsWith('.wasm.worker.js')) {
          return libPathLookup.wasmWorkerJs;
          // return libBlobLookup.wasmWorkerJs;
        } else if (s.endsWith('.worker.js')) {
          return libPathLookup.workerJs;
          // return libBlobLookup.workerJs;
        }
        console.warn("Unknown file", s);
        return "vhacd/" + s;
      },
    });
    console.log("Ammo", Ammo);
    return Ammo;
  });
}

/*
export function main(options: Options = {}) {
  return loadModule(options)
  .then(async (Ammo) => {
    const h = new Ammo.VHACDHelpers();
    console.log("helper", h);

    // const vhacd = h.CreateVHACD_ASYNC();
    const vhacd = h.CreateVHACD();
    console.log("vhacd", vhacd);

    const rows = cubeContents
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split(" "));
    const vertices = rows
      .filter((row) => row[0] === "v")
      .map((row) => row.slice(1).map(parseFloat));
    const faces = rows
      .filter((row) => row[0] === "f")
      .map((row) => row.slice(1))
      .map((row) => row.map((cell) => parseInt(cell.split("/")[0]) - 1));

    // console.log(contents);
    console.log("Model", vertices.length, faces.length);
    console.log("Model", { vertices, faces });

    const parameters = new Ammo.Parameters();
    const logging = new Ammo.Logging();
    parameters.m_callback = logging;
  
    // parameters.m_maxConvexHulls = maxConvexHulls;
    // parameters.m_resolution = 100000; //10000000; //10000000;
    // parameters.m_minimumVolumePercentErrorAllowed = 1; //0;//0.01;
  
    // parameters.set_m_maxConvexHulls(maxConvexHulls);
    parameters.set_m_resolution(100000); //10000000; //10000000;
    parameters.set_m_minimumVolumePercentErrorAllowed(1); //0;//0.01;
  
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
  
    console.log('Compute',
      points,
      vertices.length,
      triangles,
      faces.length,
      parameters
    );
    const startTime = Date.now();
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
      const endTime = Date.now();
      const nHulls = vhacd.GetNConvexHulls();
      console.log("Found", nHulls, "hulls");
      console.log("Time", (endTime - startTime) / 1000, " seconds");
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
}
*/
