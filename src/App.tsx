import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Leva } from 'leva';

import { OrbitControls, OrthographicCamera } from './core';
import { Game } from './components';

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
        <OrbitControls
          minPolarAngle={Math.PI * (2 / 6)}
          maxPolarAngle={Math.PI * (4 / 6)}
        />
        <Game />
      </Canvas>
    </>
  );
}

export default App;
