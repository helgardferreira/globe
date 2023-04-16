import { useState } from 'react';
import { Object3D } from 'three';

import { Globe } from './Globe';
import RotateControls from './RotateControls';

export const Game = () => {
  const [globeObject, setGlobeObject] = useState<Object3D | null>(null);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[-20, 20, 20]} />
      <Globe ref={(ref) => setGlobeObject(ref)} />
      {globeObject && <RotateControls object={globeObject} />}
    </>
  );
};
