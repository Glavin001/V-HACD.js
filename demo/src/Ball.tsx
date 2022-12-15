import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { BallCollider, RigidBody, RigidBodyApi } from "@react-three/rapier";
import { RigidBodyProps } from '@react-three/rapier/dist/declarations/src/RigidBody';
import { folder, useControls } from 'leva';

export const Balls = () => {
  const { center } = useControls({
    'Visual Options': folder({
      center: {
        label: 'Balls Center',
        value: [0,0,0],
      },
    }),
  })
  return (<group>
    { 
      new Array(300).fill(null)
        .map((_, index) => (
          <Ball
            key={index}
            center={center}
            position={[
              Math.random(),
              5 + 2 * index,
              Math.random()
            ]}
          />
        ))
    }
  </group>
  );
}

export const Ball = ({ center, ...props}: any) => {
  const ball = useRef<RigidBodyApi>(null);
  const groundedAt: any = useRef<Date>(null)

  useFrame(() => {
    if (ball.current) {
      if (ball.current.translation().y < -1.4) {
        groundedAt.current = groundedAt.current ?? new Date();
      }
      if (groundedAt.current && (+(new Date()) - groundedAt.current) > 3000) {
        ball.current.setTranslation({
          x: (Math.random() - 0.5) * 1 + center[0],
          y: 5 + Math.random() * 5 + center[1],
          // z: 0 
          z: (Math.random() - 0.5) * 1 + center[2],
        });
        ball.current.setLinvel({ x: 0, y: 0, z: 0 });
        groundedAt.current = null;
      }
    }
  });

  return (
    <RigidBody ref={ball} colliders="ball" {...props}>
      <BallCollider mass={0.001} args={[0.02]}>
        <Sphere castShadow receiveShadow args={[0.02]}>
          <meshPhysicalMaterial color="red" />
        </Sphere>
      </BallCollider>
    </RigidBody>
  );
};
