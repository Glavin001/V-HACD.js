import React, { Suspense, useMemo, useRef, useState } from 'react'
import { ComputeResult, ConvexHull, VHACD } from 'v-hacd'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats, Center, Box } from '@react-three/drei'
import { Physics, RigidBody, Debug } from "@react-three/rapier";
// import quickHull from 'quickhull3d'
import { Leva } from 'leva';

import './App.css'
// import reactLogo from './assets/react.svg'
import { Model } from './Model'
import { VHACDPreview } from './VHACDPreview'

function App() {
  return (
    <div className="canvas-container">
      <Leva oneLineLabels />
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
            {/* <Debug /> */}
            <Floor />

            <VHACDPreview />

          </Physics>
        </Suspense>

      </Canvas>
    </div>
  )
}

export default App

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
