import { useEffect } from 'react';
import { useSelector } from '@xstate/react';
import { useControls } from 'leva';

import { useServices } from '../GlobalStateProvider';

export const Globe = () => {
  const { globeBuilderService } = useServices();
  const dotMesh = useSelector(
    globeBuilderService,
    (state) => state.context.dotMesh
  );

  const { dotDensity, dotOffset, globeRadius, rows } = useControls({
    dotDensity: {
      max: 100,
      min: 1,
      step: 1,
      value: 50,
    },
    dotOffset: {
      max: 1.5,
      min: 0,
      value: 0,
    },
    globeRadius: {
      max: 1.4,
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
      dotDensity,
      dotOffset,
      globeRadius,
      rows,
    });
  }, [dotDensity, dotOffset, globeBuilderService, globeRadius, rows]);

  return (
    <group>
      <mesh scale={[globeRadius, globeRadius, globeRadius]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color={0xffffff} />
      </mesh>
      {dotMesh && <primitive object={dotMesh} />}
    </group>
  );
};
