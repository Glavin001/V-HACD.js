import React, { PropsWithChildren, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ComputeResult, ConvexHull, VHACD } from 'v-hacd'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Center, Box, Text, BBAnchor } from '@react-three/drei'
import { Physics, RigidBody, Debug, ConvexHullCollider, MeshCollider, Vector3Array } from "@react-three/rapier";
// import quickHull from 'quickhull3d'
import * as THREE from 'three'
import { BufferGeometry, Vector3 } from 'three'
import { button, folder, useControls } from 'leva'
import { ConvexGeometry, mergeVertices, OBJExporter } from 'three-stdlib';
import {
  fileOpen,
  directoryOpen,
  fileSave,
  supported as fsSupported,
} from 'browser-fs-access';

import { MarketModels as marketModels } from './market-models';

import './App.css'
// import reactLogo from './assets/react.svg'
import { Model } from './Model'
import { Ball, Balls } from './Ball';

const testModels = {
  // 'Cube': '/models/cube.obj',
  // 'Mite': '/models/mite.obj',
  // 'Umbrella': '/models/umbrella.obj',
  // 'Joy Stick': '/models/joy-stick.obj',
  'Al': '/meshes/al.obj',
  'Beshon': '/meshes/beshon.obj',
  'Blonde': '/meshes/blonde.obj',
  'Box Thick': '/meshes/box-thick.obj',
  'Bunny': '/meshes/bunny.obj',
  'Caterpillar': '/meshes/caterpillar.obj',
  'Character': '/meshes/character.obj',
  'Cow No Normals': '/meshes/cow-nonormals.obj',
  'Cube': '/meshes/cube.obj',
  'Cylinder': '/meshes/cylinder.obj',
  'Deer Bound': '/meshes/deer_bound.obj',
  'Defsphere': '/meshes/defsphere.obj',
  'Hornbug': '/meshes/hornbug.obj',
  'Hose': '/meshes/hose.obj',
  'Lamp': '/meshes/lamp.obj',
  'Mite': '/meshes/mite.obj',
  'Chair Gorthic': '/meshes/ob_chair_gothic.obj',
  'Chair Wood': '/meshes/ob_chair_wood.obj',
  'Chess Table': '/meshes/ob_chess_table.obj',
  'Sphere': '/meshes/sphere.obj',
  'Spider': '/meshes/spider.obj',
  'Teapot': '/meshes/teapot.obj',
  'Teddy': '/meshes/teddy.obj',
  'Torus 1': '/meshes/torus1.obj',
  'Torus 2': '/meshes/torus2.obj',
  'Wall': '/meshes/wall.obj',
} as const;

export function VHACDPreview() {
  const modelRef = useRef();
  const [hulls, setHulls] = useState<ComputeResult | null>(null);
  const [customModel, setCustomModel] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'computing'>('idle')
  const marketModelOptions = useMarketModels();
  const modelOptions: Record<string, string> = useMemo(() => {
    return {
      ...mapKeys(testModels, (k) => `${k} (Tests)`),
      ...mapKeys(marketModelOptions, (k) => `${k} (market.pmnd.rs)`),
    }
  }, [marketModelOptions, testModels])
  console.log('modelOptions', modelOptions);

  const hasHulls = !!(hulls && hulls.hulls.length > 0);
  const isComputing = status === 'computing';

  const mode = 'WASM';

  const [{ model: _model }, setModelControls] = useControls(() => ({
    model: {
      label: 'Model',
      value: testModels['Chair Wood'],
      options: {
        "Uploaded Model": "Custom Model",
        ...modelOptions,
      },
    },
    'Upload Model (GLB/GLTF/OBJ)': button(async () => {
      if (fsSupported) {
        console.log('Using the File System Access API.');
      } else {
        console.log('Using the fallback implementation.');
      }
      const blob = await fileOpen({
        description: '3D Models',
        mimeTypes: [
          // GLTF
          'model/gltf-binary', 'model/gltf+json',
          // OBJ
          'model/obj',
        ],
        extensions: [
          // GLTF
          '.glb', '.gltf',
          // OBJ
          '.obj',
        ],
      });
      // Get extension from blob/file

      const origFileName = blob?.name;
      const fileExtension = origFileName ? origFileName.toLowerCase().split('.').pop() : '';

      const url = URL.createObjectURL(blob);
      const urlWithExtension = `${url}.${fileExtension}`
      console.log('blob', blob, url, urlWithExtension);
      setCustomModel(urlWithExtension);
      setModelControls({
        model: "Custom Model",
      });
    }),
  }), [setCustomModel, modelOptions, customModel])

  // const { model: _model } = useControls({
  //   model: {
  //     label: 'Model',
  //     // value: '/models/cube.obj',
  //     // value: '/models/mite.obj',
  //     // value: '/meshes/mite.obj',
  //     // value: testModels.Teapot,
  //     // value: testModels.Mite,
  //     value: testModels['Chair Wood'],
  //     // onChange: () => {
  //     //   setHulls(null);
  //     // },
  //     options: modelOptions,
  //   },
  // });
  // const model = customModel || _model;
  const model = _model === "Custom Model" ? customModel : _model;
  console.log('model', { _model, model });
  useControls({
    'V-HACD Options': folder({
    /*
    mode: {
      label: 'Mode',
      value: 'WASM',
      options: ['WASM', 'JS'],
    },
    */
    maxConvexHulls: {
      label: 'Max # Hulls',
      value: 64,
      step: 1,
      min: 1,
    },
    resolution: {
      label: 'Voxel Resolution',
      value: 400000,
      step: 1,
      min: 1,
    },
    maxRecursionDepth: {
      label: 'Max Recursion Depth',
      value: 12,
      step: 1,
      min: 1,
    },
    minimumVolumePercentErrorAllowed: {
      label: 'Min Volume % Error Allowed',
      value: 1,
      step: 0.001,
      min: 0.001,
    },
    }),
  })

  useControls({
    [isComputing ? "Computing" : "Compute"]: button(async (get) => {
      let vhacd: VHACD | null = null;
      try {
        setStatus('computing');

        await alert("Starting soon, may take a while. Open the Console in Developer Tools to see the progress of the computation.");

        vhacd = new VHACD({
          mode: mode as any,
        });
        const model = get('model');

        console.log('modelRef', model, modelRef);

        const params = {
          maxConvexHulls: get('maxConvexHulls'),
          resolution: get('resolution'),
          maxRecursionDepth: get('maxRecursionDepth'),
          minimumVolumePercentErrorAllowed: get('minimumVolumePercentErrorAllowed'),
        };

        // const contents = await fetch(model).then(res => res.text());
        // console.log('model', { model, contents });
        // // const { vertices, faces } = objToGeometry(cubeContents)
        // // const { vertices, faces } = objToGeometry(miteContents)
        // const { vertices, faces } = objToGeometry(contents)
        // const { vertices, faces } = getVerticesAndFaces(obj);

        const { vertices, faces } = getVerticesAndFaces(modelRef.current);

        console.log('model', { vertices, faces, params });
        console.log("=".repeat(80))
        console.log("Starting Computing...")
        const res = await vhacd.compute({ vertices, faces, ...params });
        console.log('Done Computing!');
        console.log("=".repeat(80))
        console.log("Result:", res);
        setHulls(res);
        setStatus('idle')
      } catch (error: any) {
        setStatus('idle');
        console.error(error);
        alert(error.toString()); 
      } finally {
        if (vhacd) {
          // vhacd.release();
        }
      }
    }, {
      disabled: isComputing,
    }),
  }, [isComputing]);

  const { showOriginal, showHulls } = useControls({
    'Visual Options': folder({
    showOriginal: {
      label: 'Show Mesh',
      value: true,
    },
    showHulls: {
      label: 'Show Hulls',
      value: true,
    },
    }, {
      collapsed: true,
    }),
  });

  useControls(() => (hasHulls ? {
    Export: folder({
    'Copy JSON of convex hulls': button(() => {
      const contents = JSON.stringify(hulls?.hulls, null, 2)
      navigator.clipboard.writeText(contents)
        .catch(console.error);
    }),
    })
  } : {} as any), [hasHulls, hulls])

  const [{ offset, visualOffset }, setControls] = useControls(() => ({
    'Visual Options': folder({
    offset: {
      label: 'Offset',
      value: [0,0,0],
    },
    visualOffset: {
      label: 'Visual Offset',
      value: [0,0,0],
    },
    }, {
      collapsed: true,
    }),
  }));

  useEffect(() => {
    setHulls(null);
  }, [model]);

  // const { size = [1,1,1], center = [0,0,0] } = useMemo(() => {
  useEffect(() => {
    console.log('updated modelRef', modelRef);
    if (!modelRef.current) {
      return;
    }
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const center = box.getCenter(new THREE.Vector3()).toArray();
    const size = box.getSize(new THREE.Vector3()).toArray();
    console.log('center', center);
    console.log('size', size);
    setControls({
      offset: center.map(v => -v) as THREE.Vector3Tuple,
      visualOffset: center.map(v => -v) as THREE.Vector3Tuple,
    });
    // return { size, center };
  }, [model, modelRef, setControls])

  // const offset = useMemo(() => {
  //   return center.map(v => -v);
  // }, [center]);

  if (!model) {
    return null;
  }

  // console.log('(showOriginal && !hasHulls) || !showHulls', (showOriginal && !hasHulls) || !showHulls, { showOriginal, hasHulls, showHulls })
  return (
    <group
      position={[0, 0, 0]}
    >
        {/* <RigidBody key={model}
            colliders={"hull"}
            position={[0, 0, 0]}
            // restitution={2}
            {...{} as any}
        >
            <Model src={model} />
        </RigidBody> */}

        {
          <group
            // position={[2, 0, 0]}
            // ref={modelRef}
            // visible={showOriginal || !hasHulls}
            // visible={(showOriginal && !hasHulls) || !showHulls}
            // visible={(showOriginal && (!showHulls || !hasHulls)}
            // visible={(showOriginal && !showHulls) || !hasHulls}
            // visible={!hasHulls || (showOriginal && !showHulls)}
            visible={
              !hasHulls
              // || (hasHulls && showOriginal)
              // || (showOriginal && !showHulls)
              // || (showOriginal && showHulls)
            }
          >
            <group position={offset}>
              <Model key={model} src={model} modelRef={modelRef} />
            </group>
            {/*
            <BBAnchor anchor={[0, 5, -5]}>
              <Text color="red" anchorX="center" anchorY="middle" fontSize={1}>
                {hulls?.timing.total ? (
                    `Done in ${(hulls.timing.total / 1000).toFixed(2)} seconds`
                ) : (isComputing
                  ? (
                    "Computing..."
                  )
                  : (
                    "Click the Compute button -->"
                  )
                )}
              </Text>
            </BBAnchor>
            */}
          </group>
        }

        {/* <RigidModel src="/models/umbrella.obj" position={[1, 3, 0]} /> */}

        {/*
        <RigidBody
            position={[0, 0.5, 0.3]}
            scale={[0.5, 0.5, 0.5]}
            // scale={[3, 3, 3]}
            colliders="hull"
            restitution={0}
            friction={100}
            {...{} as any}
        >
            <Box args={[1, 1, 1]} {...{} as any} />
        </RigidBody>
        */}

        <group
          // position={[-2, 0, 0]}
        >
          {hulls?.hulls && (
            <>
              <Balls />
              <Hulls
                key={model}
                hulls={hulls.hulls}
                opacity={showOriginal ? 0.8 : 1}
                visible={showHulls}
                // opacity={debug ? 1 : 0.8}
              >
                {(showOriginal || !showHulls) && (
                  <group position={visualOffset}>
                    <Model key={model} src={model} />
                  </group>
                )}
              </Hulls>
            </>
          )}
        </group>
    </group>
  )
}

/*
const RigidModel = ({ src, ...props }: any) => {
  return (
    <RigidBody
      colliders={"hull"}
      {...props}
    >
      <Model src={src} />
    </RigidBody>
  );
}
*/

function Hulls({ hulls = [], opacity = 1, offset, visible = true, children }: PropsWithChildren<{ hulls: ConvexHull[]; opacity?: number; offset?: Vector3Array; visible?: boolean; }>) {
  console.log('Hulls', hulls)

  const convexGeometries = useMemo(() => {
    return (hulls || []).map((shapePoints: any) => {
      const points = shapePoints.map((p: any) => new Vector3().fromArray(p))
      // console.log('points', points)
      const geometry = new ConvexGeometry(points)

      // geometry.mergeVertices()
      // geometry.computeBoundingSphere()
      // geometry.computeFaceNormals()
      // const geometry = new THREE.Geometry() // create geometry
      //   .fromBufferGeometry(buffGeometry) // from buffer

      // return mergeVertices(geometry)
      //if using import statement
      //geometry = BufferGeometryUtils.mergeVertices(geometry);

      // return geometry
      return new BufferGeometry().copy(geometry);
    })
  }, [hulls])

  console.log('convexGeometries', convexGeometries)

  // const hullShapes = useMemo(
  //   () =>
  //     gearCollisionPoints.map((shapePoints) => ({
  //       type: ShapeType.HULL,
  //       points: shapePoints.map((p) => {
  //         return [p[0] + 0, p[1] + 0, p[2] + 0.125]
  //       })
  //     })),
  //   [gearCollisionPoints]
  // )

  // const shapes = useMemo(() => {
  //   return convexGeometries.map((geometry) => {
  //     let position = geometry.attributes.position.array
  //     // let geomFaces = geometry.index.array
  //     const geomFaces = geometry.attributes.normal.array

  //     const vertices = []
  //     const faces = []

  //     for (let i = 0; i < position.length; i += 3) {
  //       // points.push(new CANNON.Vec3(position[i], position[i+1], position[i+2]));
  //       vertices.push([position[i], position[i + 1], position[i + 2]])
  //     }

  //     for (let i = 0; i < geomFaces.length; i += 3) {
  //       faces.push([geomFaces[i], geomFaces[i + 1], geomFaces[i + 2]])
  //     }

  //     // const vertices = geometry.vertices.map(function (v) {
  //     //   return new CANNON.Vec3(v.x, v.y, v.z)
  //     //   // return [v.x, v.y, v.z];
  //     // })

  //     // const faces = geometry.faces.map(function (f) {
  //     //   return [f.a, f.b, f.c]
  //     // })

  //     return {
  //       type: 'ConvexPolyhedron',
  //       args: [vertices, faces]
  //     }
  //   })
  // }, [convexGeometries])

  // const shapes = useMemo(() => {
  //   return gearCollisionPoints.map((shapePoints) => {
  //     const points = shapePoints.map((p) => new THREE.Vector3().fromArray(p))
  //     const convexHull = new ConvexHull().setFromPoints(points)
  //     // const { vertices, faces } = convexHull
  //     console.log('convexHull', convexHull)

  //     // const vertices = convexHull.vertices.map(function (v) {
  //     //   // return new CANNON.Vec3(v.x, v.y, v.z)
  //     //   return [v.x, v.y, v.z]
  //     // })
  //     // const faces = convexHull.faces.map(function (f) {
  //     //   return [f.a, f.b, f.c]
  //     // })

  //     const hullFaces = convexHull.faces
  //     const vertices = []
  //     const faces = []
  //     for (let i = 0; i < hullFaces.length; i++) {
  //       const hullFace = hullFaces[i]
  //       const face = []
  //       faces.push(face)

  //       let edge = hullFace.edge
  //       do {
  //         const point = edge.head().point
  //         // vertices.push( new Vec3(point.x, point.y, point.z) );
  //         vertices.push([point.x, point.y, point.z])
  //         face.push(vertices.length - 1)
  //         edge = edge.next
  //       } while (edge !== hullFace.edge)
  //     }

  //     return {
  //       type: 'ConvexPolyhedron',
  //       args: [vertices, faces]
  //     }
  //   })
  // }, [])

  // const shapes = useMemo(() => {
  //   return gearCollisionPoints.map((shapePoints) => {
  //     const vertices = shapePoints.map((p) => new THREE.Vector3().fromArray(p))
  //     // const convexHull = new ConvexHull().setFromPoints(vertices)
  //     // const { vertices, faces } = convexHull
  //     // console.log('convexHull', convexHull)

  //     const faces = quickHull(vertices)

  //     console.log('hull', { vertices, faces })
  //     return {
  //       type: 'ConvexPolyhedron',
  //       position: [0, 0, 0],
  //       rotation: [0, 0, 0],
  //       // args: [vertices, faces]
  //       args: [shapePoints, faces]
  //     }
  //   })
  // }, [])

  // console.log('shapes', shapes)

  // const [ref] = useCompoundBody(
  //   () => ({
  //     mass: 1,
  //     ...props,
  //     shapes
  //     // shapes: [
  //     //   { type: 'Box', position: [0, 0, 0], rotation: [0, 0, 0], args: [1, 1, 1] },
  //     //   { type: 'Sphere', position: [1, 0, 0], rotation: [0, 0, 0], args: [0.65] }
  //     // ]
  //   }),
  //   undefined,
  //   [shapes]
  // )

  const colors = useMemo(() => {
    return hulls.map(hull => {
      const color = new THREE.Color( 0xffffff );
      color.setHex( Math.random() * 0xffffff );
      return color;
    })
  }, [hulls.length])

  const [key, setKey] = useState(1);
  useControls({
    "Refresh Render": button(() => {
      setKey(v => v+1);
    }),
  })

  return (
    <group
      // ref={ref}
      key={key}
    >
    <RigidBody colliders={false} position={offset}>
      <group visible={visible}>
      {convexGeometries.map((geo: any, index: number) => (
        <MeshCollider key={index} type="hull">
          <mesh key={index} receiveShadow castShadow geometry={geo}>
            {/* <meshNormalMaterial /> */}
            <meshStandardMaterial color={colors[index]} transparent={opacity !== 1} opacity={opacity} />
          </mesh>
        </MeshCollider>
      ))}
      </group>
      {children}
    </RigidBody>
    </group>
  )
}

function getVerticesAndFaces(object: any) {
  const exporter = new OBJExporter();
  const contents = exporter.parse(object);
  // console.log('contents', contents);

  const { vertices, faces } = objToGeometry(contents);
  // console.log(contents);
  console.log(vertices.length, faces.length);
  // console.log('useVerticesAndFaces', { vertices, faces });

  return {
    vertices,
    faces,
  };
}

function objToGeometry(contents: string) {
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
    .map((row) => row.map((cell) => parseInt(cell.split("/")[0], 10) - 1));
  return {
    vertices,
    faces,
  }
}

// const MARKET_MODELS_API = 'https://market.pmnd.rs/api/models';
function useMarketModels() {
  // const [marketModels, setMarketModels] = useState(() => []);
  // // console.log('MarketModels', MarketModels);
  // useEffect(() => {
  //   fetch(MARKET_MODELS_API)
  //     .then(res => res.json())
  //     .then(res => setMarketModels(res))
  //     ;
  // }, []);
  return useMemo(() => {
    const names = marketModels.map(({ name }) => name).sort();
    const ModelOptions = names.reduce((f, name) => {
      const c = marketModels.find(({ name: n }) => n === name);
      if (!c) {
        return f;
      }
      // f[name] = c.id;
      f[name] = c.file;
      return f;
    }, {} as Record<string, string>);
    return ModelOptions;
  }, [marketModels]);
}

function mapKeys<T extends object>(obj: T, cb: (k: string, v: any) => string): T {
  return Object.fromEntries(
    Array.from(Object.entries(obj))
      .map(([key, val]) => (
        [cb(key, val), val]
      ))
  ) as any as T
}

// function getVerticesAndFaces(obj: any) {
//   // const origGeometry = obj?.type === 'BufferGeometry' ? obj : obj.geometry;
//   const origGeometry = getSingleGeometry(obj);
//   if (!origGeometry) {
//     throw new Error('No geometry found');
//   }
//   const simpleGeo = mergeVertices(origGeometry, 10);

//   const vertices = [];
//   const positionAttribute = simpleGeo.getAttribute( 'position' );

//   for ( let i = 0; i < positionAttribute.count; i ++ ) {

//     const vertex = new THREE.Vector3();
//     vertex.fromBufferAttribute( positionAttribute, i );
//     vertices.push( vertex );
//   }
//   const faces: any[] = [];

//   return {
//     vertices,
//     faces,
//   };
// }

// function getSingleGeometry(obj: any) {
//   if (obj?.type === 'BufferGeometry') {
//     return obj;
//   }
//   if (obj?.geometry) {
//     return obj.geometry;
//   }
//   const meshes = getMeshes(obj);
//   if (meshes.length === 0) {
//     throw new Error('No geometry found');
//   }
//   const geos = meshes.map(m => m.geometry);
//   const finalGeo = mergeBufferGeometries(geos);
//   return finalGeo;
// }

// function getMeshes(object: any) {
//   const meshes = [];
//   if (object.isMesh) {
//     meshes.push(object);
//   }
//   object.traverse(function (o) {
//     if (o.isMesh) {
//       meshes.push(o);
//     }
//   });
//   return meshes;
// }

// /**
//  * Greatly simplified version of BufferGeometryUtils.mergeBufferGeometries.
//  * Because we only care about the vertex positions, and not the indices or
//  * other attributes, we throw everything else away.
//  * Source: https://github.com/donmccurdy/three-to-cannon/blob/main/src/utils.ts
//  */
// function mergeBufferGeometries(geometries: any[]) {
//   let vertexCount = 0;
//   for (let i = 0; i < geometries.length; i++) {
//     const position = geometries[i].attributes.position;
//     if (position && position.itemSize === 3) {
//       vertexCount += position.count;
//     }
//   }

//   const positionArray = new Float32Array(vertexCount * 3);

//   let positionOffset = 0;
//   for (let i = 0; i < geometries.length; i++) {
//     const position = geometries[i].attributes.position;
//     if (position && position.itemSize === 3) {
//       for (let j = 0; j < position.count; j++) {
//         positionArray[positionOffset++] = position.getX(j);
//         positionArray[positionOffset++] = position.getY(j);
//         positionArray[positionOffset++] = position.getZ(j);
//       }
//     }
//   }

//   return new THREE.BufferGeometry().setAttribute(
//     "position",
//     new THREE.BufferAttribute(positionArray, 3)
//   );
// }
