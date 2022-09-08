import { PropsWithChildren, useMemo } from 'react';
import { OBJLoader, mergeVertices } from 'three-stdlib'
import { GroupProps, useLoader } from '@react-three/fiber'
import { Center, Clone } from '@react-three/drei'

export interface ModelProps extends PropsWithChildren<GroupProps> {
    src: string;
}

export function Model({ src, ...props }: ModelProps) {
    const obj = useLoader(OBJLoader, src)
    //   const obj = useLoader(OBJLoader, '/models/mite/mite.obj')
    //   const collision = useLoader(OBJLoader, '/models/mite/decomp-8.obj')
    // console.log('Model obj', src, obj, props);
    console.log('Model obj', src, obj);
    const simplerGeo = useMemo(() => {
        const geo = (obj.children[0] as any)?.geometry;
        return mergeVertices(geo);
    }, [obj, src]);

    console.log('Model obj', obj, simplerGeo);
    return (
        <group {...props}>
            <Center {...{} as any}>
                <Clone
                    receiveShadow
                    castShadow
                    object={obj.children ? obj.children : obj}
                    dispose={null}
                    inject={() => (
                        <meshNormalMaterial />
                        // props.children
                    )}
                />
                {/* <mesh
                    key={src}
                    // geometry={obj?.geometry}
                    geometry={simplerGeo}
                >
                    <meshStandardMaterial color="#ff0000" />
                </mesh> */}
                {/* <group>
                    <primitive object={obj} />
                </group> */}
            </Center>
        </group>
    )
}
