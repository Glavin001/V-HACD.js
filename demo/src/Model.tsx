import { PropsWithChildren, useMemo } from 'react';
import { OBJLoader, mergeVertices } from 'three-stdlib'
import { GroupProps, useLoader } from '@react-three/fiber'
import { Center, Clone, Stage, useGLTF } from '@react-three/drei'

export interface ModelProps extends PropsWithChildren<GroupProps> {
    src: string;
    modelRef?: any;
}

export function Model({ src, modelRef, ...props }: ModelProps) {
    // const obj = useLoader(OBJLoader, src)

    //   const obj = useLoader(OBJLoader, '/models/mite/mite.obj')
    //   const collision = useLoader(OBJLoader, '/models/mite/decomp-8.obj')
    // console.log('Model obj', src, props);

    let obj: any;
    let material: any;
    let mesh: any;

    const ext = src.split('.').pop();
    // Remove the extension, .glb
    const cleanSrc = src.startsWith('blob:') ? src.split('.').slice(0, -1).join('.') : src;
    if (ext === 'gltf' || ext === 'glb') {
      const gltf = useGLTF(cleanSrc);
      obj = gltf.scene;
      mesh = (<primitive object={obj} />);
    // } else if (src.endsWith(".spline")) {
    //   const spline = useSpline(src);
    //   // obj = spline.nodes.Big;
    //   const nodeName = 'Little';
    //   obj = spline.nodes[nodeName];
    //   src = `${src}-${nodeName}`;
    //   console.log('Spline', spline, obj);
    } else {
      obj = useLoader(OBJLoader, cleanSrc)
      material = () => <meshNormalMaterial />
    //   const geo = (obj.children[0] as any)?.geometry;
    //   mesh = (
    //     <mesh
    //     geometry={geo}
    //         // geometry={obj?.geometry}
    //         // geometry={simplerGeo}
    //     >
    //         <meshNormalMaterial />
    //         {/* <meshStandardMaterial color="#ff0000" /> */}
    //     </mesh>
    //   )
        mesh = (
            <Clone
                object={obj}
                dispose={null}
                inject={material}
            />
        )
    }

    console.log('Model obj', src, obj);
    // const simplerGeo = useMemo(() => {
    //     const geo = (obj.children[0] as any)?.geometry;
    //     return mergeVertices(geo);
    // }, [obj, src]);

    // console.log('Model obj', obj, simplerGeo);
    return (
        <group {...props}>
            {/* <Stage
                contactShadow={{
                    blur: 1
                }}
                shadows
                adjustCamera
                intensity={1}
                environment="city"
                preset="rembrandt"
                // controls={controlsRef}
            > */}
            {/* <Center {...{} as any}> */}
                <group ref={modelRef}>
                    {/* <Clone
                        // receiveShadow
                        // castShadow
                        // object={obj.children ? obj.children : obj}
                        object={obj}
                        dispose={null}
                        inject={material}
                        // inject={() => (
                        //     <meshNormalMaterial />
                        //     // props.children
                        // )}
                    /> */}
                    {/* <mesh
                        key={src}
                        // geometry={obj?.geometry}
                        geometry={simplerGeo}
                    >
                        <meshStandardMaterial color="#ff0000" />
                    </mesh> */}
                    {/* <primitive object={obj} /> */}
                    {mesh}
                </group>
            {/* </Center> */}
            {/* </Stage> */}
        </group>
    )
}
