import { useEffect } from 'react';
import { useSelector } from '@xstate/react';
import { DEG2RAD } from 'three/src/math/MathUtils';

import { useServices } from '../GlobalStateProvider';
import { useGlobeControls } from '../utils/hooks';
import { Path } from './Path';

export const Globe = () => {
  const { globeService } = useServices();
  const dotMesh = useSelector(globeService, (state) => state.context.dotMesh);

  const { dotDensity, dotOffset, globeRadius, rows } = useGlobeControls();

  useEffect(() => {
    globeService.send({
      type: 'UPDATE_GLOBE_DOTS',
      dotDensity,
      dotOffset,
      globeRadius,
      rows,
    });
  }, [dotDensity, dotOffset, globeRadius, rows, globeService]);

  return (
    <group rotation={[0, 290 * DEG2RAD, 0]}>
      <group>
        <mesh scale={[globeRadius, globeRadius, globeRadius]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color={0xffffff} />
        </mesh>
        <Path globeRadius={globeRadius} />
      </group>
      {dotMesh && <primitive object={dotMesh} />}
    </group>
  );
};
