import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useActor } from '@xstate/react';
import { Vector3 } from 'three';
import { Leva, useControls } from 'leva';

import { OrbitControls, OrthographicCamera } from './core';
import { globeBuilderService } from './services/globeBuilder.machine';

const Globe = () => {
  const [state, send] = useActor(globeBuilderService);
  const { dotMesh } = state.context;

  const { dotDensity, globeRadius, rows } = useControls({
    dotDensity: {
      max: 100,
      min: 1,
      step: 1,
      value: 50,
    },
    globeRadius: {
      max: 10,
      min: 1,
      value: 1,
    },
    rows: {
      max: 1000,
      min: 1,
      step: 1,
      value: 200,
    },
  });

  useEffect(() => {
    send({
      type: 'UPDATE_GLOBE_DOTS',
      rows,
      dotDensity,
      globeRadius,
    });
  }, [dotDensity, globeRadius, rows, send]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color={0xffffff} />
      </mesh>
      {dotMesh && <primitive object={dotMesh} />}
    </group>
  );
};

const Game = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[-20, 20, 20]} />
      <Globe />
    </>
  );
};

function App() {
  return (
    <>
      <Leva />
      <Canvas
        style={{
          width: '100vw',
          height: '100vh',
        }}
      >
        <OrthographicCamera position={new Vector3(200, 200, 200)} zoom={270} />
        <OrbitControls />
        <Game />
      </Canvas>
    </>
  );
}

export default App;
