import React, { Suspense, useRef, useState } from 'react'
import { ComputeResult, ConvexHull, VHACD } from 'v-hacd'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats, Center, Box } from '@react-three/drei'
import { Physics, RigidBody, Debug } from "@react-three/rapier";

import './App.css'
import reactLogo from './assets/react.svg'
import { Model } from './Model'

function App() {
  const [count, setCount] = useState(0)
  const [hulls, setHulls] = useState<ComputeResult | null>(null);

  const onClick = async () => {
    setCount((count) => count + 1)

    const vhacd = new VHACD();
    const { vertices, faces } = objToGeometry(cubeContents)
    const res = await vhacd.compute({ vertices, faces });
    console.log("Result:", res);
    setHulls(res);
  }

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={onClick}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <pre>
        {JSON.stringify(hulls, null, 2)}
      </pre>
      <div className="canvas-container">
        <Canvas>
          <Stats />
          <OrbitControls />
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          {/* <Box position={[-1.2, 0, 0]} />
          <Box position={[1.2, 0, 0]} /> */}

          {/* <Model src="/models/cube.obj" position={[-1, 0, 0]} scale={[0.01, 0.01, 0.01]} />
          <Model src="/models/mite.obj" position={[-3, 0, 0]} />
          <Model src="/models/umbrella.obj" position={[2, 0, 0]} scale={[2, 2, 2]} /> */}

          <Suspense>
            <Physics>
              <Debug />
              <Floor />
              <RigidBody
                colliders={"hull"}
                position={[0, 0, 0]}
                // restitution={2}
                {...{} as any}
              >
                {/* <Torus /> */}
                {/* <Center> */}
                  <Model src="/models/mite.obj" />
                {/* </Center> */}
              </RigidBody>

              {/* <RigidModel src="/models/umbrella.obj" position={[1, 3, 0]} /> */}

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
                {/* <Model src="/models/cube.obj" scale={[0.01, 0.01, 0.01]} /> */}
              </RigidBody>
              
            </Physics>
          </Suspense>

        </Canvas>
      </div>
    </div>
  )
}

export default App

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

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid" {...{} as any}>
      <Box
        args={[1,1,1]}
        // position={[0, -12.55 - 5, 0]}
        position={[0, -2, 0]}
        scale={[200, 1, 200]}
        rotation={[0, 0, 0]}
        receiveShadow
        {...{} as any}
      >
        {/* <shadowMaterial opacity={0.2} /> */}
        <meshStandardMaterial color="#ffffff" />
      </Box>
    </RigidBody>
  );
};

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
    .map((row) => row.map((cell) => parseInt(cell.split("/")[0]) - 1));
  return {
    vertices,
    faces,
  }
}

const cubeContents = `o Cube
v -124.64166259765628 140 99.35833740234372
v -124.64166259765628 140 -2.842170943040401e-14
v -124.64166259765628 50.180633544921875 99.35833740234372
v -124.64166259765628 50.180633544921875 -2.842170943040401e-14
v -224.00000000000003 140 -2.842170943040401e-14
v -224.00000000000003 140 99.35833740234372
v -224.00000000000003 50.180633544921875 -2.842170943040401e-14
v -224.00000000000003 50.180633544921875 99.35833740234372
v -224.00000000000003 140 -2.842170943040401e-14
v -124.64166259765628 140 -2.842170943040401e-14
v -224.00000000000003 140 99.35833740234372
v -124.64166259765628 140 99.35833740234372
v -224.00000000000003 50.180633544921875 99.35833740234372
v -124.64166259765628 50.180633544921875 99.35833740234372
v -224.00000000000003 50.180633544921875 -2.842170943040401e-14
v -124.64166259765628 50.180633544921875 -2.842170943040401e-14
v -224.00000000000003 140 99.35833740234372
v -124.64166259765628 140 99.35833740234372
v -224.00000000000003 50.180633544921875 99.35833740234372
v -124.64166259765628 50.180633544921875 99.35833740234372
v -124.64166259765628 140 -2.842170943040401e-14
v -224.00000000000003 140 -2.842170943040401e-14
v -124.64166259765628 50.180633544921875 -2.842170943040401e-14
v -224.00000000000003 50.180633544921875 -2.842170943040401e-14
vt 0 1
vt 1 1
vt 0 0
vt 1 0
vt 0 1
vt 1 1
vt 0 0
vt 1 0
vt 0 1
vt 1 1
vt 0 0
vt 1 0
vt 0 1
vt 1 1
vt 0 0
vt 1 0
vt 0 1
vt 1 1
vt 0 0
vt 1 0
vt 0 1
vt 1 1
vt 0 0
vt 1 0
vn 1 0 0
vn 1 0 0
vn 1 0 0
vn 1 0 0
vn -1 0 0
vn -1 0 0
vn -1 0 0
vn -1 0 0
vn 0 1 0
vn 0 1 0
vn 0 1 0
vn 0 1 0
vn 0 -1 0
vn 0 -1 0
vn 0 -1 0
vn 0 -1 0
vn 0 0 1
vn 0 0 1
vn 0 0 1
vn 0 0 1
vn 0 0 -1
vn 0 0 -1
vn 0 0 -1
vn 0 0 -1
f 1/1/1 3/3/3 2/2/2
f 3/3/3 4/4/4 2/2/2
f 5/5/5 7/7/7 6/6/6
f 7/7/7 8/8/8 6/6/6
f 9/9/9 11/11/11 10/10/10
f 11/11/11 12/12/12 10/10/10
f 13/13/13 15/15/15 14/14/14
f 15/15/15 16/16/16 14/14/14
f 17/17/17 19/19/19 18/18/18
f 19/19/19 20/20/20 18/18/18
f 21/21/21 23/23/23 22/22/22
f 23/23/23 24/24/24 22/22/22`;
