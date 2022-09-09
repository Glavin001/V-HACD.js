import React, { PropsWithChildren, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ComputeResult, ConvexHull, VHACD } from 'v-hacd'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats, Center, Box, Text, BBAnchor } from '@react-three/drei'
import { Physics, RigidBody, Debug } from "@react-three/rapier";
// import quickHull from 'quickhull3d'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { button, useControls } from 'leva'
import { ConvexGeometry, mergeVertices, OBJExporter } from 'three-stdlib';
import { MarketModels as marketModels } from './market-models';

import './App.css'
// import reactLogo from './assets/react.svg'
import { Model } from './Model'

export function VHACDPreview() {
  const modelRef = useRef();
  const [hulls, setHulls] = useState<ComputeResult | null>(null);
  const marketModelOptions = useMarketModels();
  console.log('marketModelOptions', marketModelOptions);

  useControls({
    Compute: button(async (get) => {
      try {
        const vhacd = new VHACD({
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
        const res = await vhacd.compute({ vertices, faces, ...params });
        console.log("Result:", res);
        setHulls(res);
      } catch (error: any) {
        console.error(error);
        alert(error.toString()); 
      }
    }),
  });

  const { showOriginal, showHulls } = useControls({
    showOriginal: {
      title: 'Show Original',
      value: true,
    },
    showHulls: {
      title: 'Show Hulls',
      value: true,
    },
  });
  const { model } = useControls({
    model: {
      title: 'Model',
      // value: '/models/cube.obj',
      // value: '/models/mite.obj',
      value: '/meshes/mite.obj',
      // onChange: () => {
      //   setHulls(null);
      // },
      options: {
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
        ...marketModelOptions,
      },
    },
  });
  const { mode } = useControls({
    mode: {
      value: 'WASM',
      options: ['WASM', 'JS'],
    },
    maxConvexHulls: {
      value: 64,
      step: 1,
      min: 1,
    },
    resolution: {
      value: 400000,
      step: 1,
      min: 1,
    },
    maxRecursionDepth: {
      value: 12,
      step: 1,
      min: 1,
    },
    minimumVolumePercentErrorAllowed: {
      value: 1,
      step: 0.001,
      min: 0.001,
    },
  })

  useEffect(() => {
    setHulls(null);
  }, [model]);

  return (
    <>
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
            visible={showOriginal || !(hulls && hulls.hulls.length > 0)}
          >
            <Model key={model} src={model} modelRef={modelRef} />
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
          visible={showHulls}
        >
          {hulls?.hulls && (
            <Hulls
              hulls={hulls.hulls}
              opacity={showOriginal ? 0.8 : 1}
              // opacity={debug ? 1 : 0.8}
            />
          )}
          {hulls?.timing && (
            <BBAnchor anchor={[1, -1, -1]}>
                <Text color="red" anchorX="center" anchorY="middle" fontSize={1}>
                  {(hulls.timing.total / 1000).toFixed(4)} seconds
                </Text>
            </BBAnchor>
          )}
        </group>
    </>
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

function Hulls({ hulls = [], opacity = 1 }: { hulls: ConvexHull[]; opacity?: number; }) {
  // console.log('gearCollisionPoints', gearCollisionPoints)

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
      return geometry
    })
  }, [hulls])

  // console.log('convexGeometries', convexGeometries)

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

  return (
    <group
      // ref={ref}
    >
      {convexGeometries.map((geo: any, index: number) => (
        <mesh key={index} receiveShadow castShadow geometry={geo}>
          {/* <meshNormalMaterial /> */}
          <meshStandardMaterial color={colors[index]} transparent={opacity !== 1} opacity={opacity} />
        </mesh>
      ))}
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
