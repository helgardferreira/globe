import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSelector } from '@xstate/react';
import { Vector3 } from 'three';
import { Leva, useControls } from 'leva';

import { OrbitControls, OrthographicCamera } from './core';
import { GlobalServiceProvider, useServices } from './GlobalStateProvider';

const Globe = () => {
  const { globeBuilderService } = useServices();
  const dotMesh = useSelector(
    globeBuilderService,
    (state) => state.context.dotMesh
  );

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
    globeBuilderService.send({
      type: 'UPDATE_GLOBE_DOTS',
      rows,
      dotDensity,
      globeRadius,
    });
  }, [dotDensity, globeBuilderService, globeRadius, rows]);

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
      <GlobalServiceProvider>
        <Canvas
          style={{
            width: '100vw',
            height: '100vh',
          }}
        >
          <OrthographicCamera
            position={new Vector3(200, 200, 200)}
            zoom={270}
          />
          <OrbitControls />
          <Game />
        </Canvas>
      </GlobalServiceProvider>
    </>
  );
}

export default App;
