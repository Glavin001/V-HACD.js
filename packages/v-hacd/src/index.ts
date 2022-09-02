// const wasmPath = require.resolve('../builds/ammo.wasm.wasm')
// console.log('wasmPath', wasmPath);

const MODE: string = "WASM"; //'JS'

type MODE = "WASM" | "JS";

export interface Options {
  mode?: MODE;
}

export interface ComputeOptions {
  vertices: any[];
  faces: any[];
}


export type Vertex = [x: number, y: number, z: number];
export type ConvexHull = Vertex[];

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
      const h = new Ammo.AmmoHelpers();
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
  const modulePromise =
    MODE === "WASM"
      ? import("../lib/builds/ammo.wasm.js")
      : import("../lib/builds/ammo.js");

  return modulePromise.then(async (AmmoModule) => {
    // console.log("AmmoModule", AmmoModule, AmmoModule.default);
    const Ammo = await AmmoModule.default({
      INITIAL_MEMORY: MODE === "JS" ? 5242880 * 2 : undefined,
      mainScriptUrlOrBlob: "/vhacd/ammo.js",
      locateFile: function (s: string) {
        console.log("locateFile", s);
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
    const h = new Ammo.AmmoHelpers();
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
