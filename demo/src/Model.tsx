import { useMemo } from 'react';
import { OBJLoader, mergeVertices } from 'three-stdlib'
import { GroupProps, useLoader } from '@react-three/fiber'
import { Center, Clone } from '@react-three/drei'

export interface ModelProps extends GroupProps {
    src: string;
}

export function Model({ src, ...props }: ModelProps) {
    const obj = useLoader(OBJLoader, src)
    //   const obj = useLoader(OBJLoader, '/models/mite/mite.obj')
    //   const collision = useLoader(OBJLoader, '/models/mite/decomp-8.obj')
    //   console.log('mite obj', obj, collision)
    console.log('Model obj', obj);
    const simplerGeo = useMemo(() => {
        const geo = obj.children[0].geometry;
        return mergeVertices(geo);
    }, [obj]);

    console.log('Model obj', obj, simplerGeo);
    return (
        <group {...props}>
            <Center {...{} as any}>
                {/* <Clone
                    receiveShadow
                    castShadow
                    object={obj.children ? obj.children : obj}
                    dispose={null}
                /> */}

                <mesh
                    // geometry={obj}
                    geometry={simplerGeo}
                >
                    <meshStandardMaterial color="#ff0000" />
                    {/* <meshStandardMaterial color="#ffffff" /> */}
                    {/* <meshPhongMaterial color="#ffffff" /> */}
                </mesh>
                {/* <group>
                    <primitive object={simplerGeo} />
                </group> */}
            </Center>
        </group>
    )
}
