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

  const { dotDensity, globeRadius, rows } = useControls({
    dotDensity: {
      max: 100,
      min: 1,
      step: 1,
      value: 50,
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
