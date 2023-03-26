import { useEffect } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import { DEG2RAD } from 'three/src/math/MathUtils';

import { useGlobeControls } from '../utils/hooks';
import { Path } from './Path';
import { globeMachine } from '../services';

export const Globe = () => {
  const globeService = useInterpret(globeMachine, { services: {} });
  const dotMesh = useSelector(globeService, ({ context }) => context.dotMesh);
  const paths = useSelector(globeService, ({ context }) => context.paths);

  const { dotDensity, rows, maxPaths } = useGlobeControls();

  useEffect(() => {
    globeService.send({
      type: 'UPDATE_GLOBE_DOTS',
      dotDensity,
      rows,
    });
  }, [dotDensity, globeService, rows]);

  useEffect(() => {
    globeService.send({
      type: 'UPDATE_MAX_PATHS',
      value: maxPaths,
    });
  }, [globeService, maxPaths]);

  return (
    <group rotation={[0, 290 * DEG2RAD, 0]}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial transparent opacity={0.7} color={0x000000} />
      </mesh>
      {paths.map(({ id, pathActorRef }) => (
        <Path key={id} pathActorRef={pathActorRef} />
      ))}
      {dotMesh && <primitive object={dotMesh} />}
    </group>
  );
};
