import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';

import { OrthographicCamera } from './core';
import { Game } from './components';

function App() {
  return (
    <Canvas
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <OrthographicCamera position={new Vector3(200, 200, 200)} zoom={270} />
      <Game />
    </Canvas>
  );
}

export default App;
