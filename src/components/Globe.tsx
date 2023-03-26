import { useEffect } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import { DEG2RAD } from 'three/src/math/MathUtils';

import { Path } from './Path';
import { globeMachine } from '../services';

export const Globe = () => {
  const globeService = useInterpret(globeMachine, { services: {} });
  const dotMesh = useSelector(globeService, ({ context }) => context.dotMesh);
  const paths = useSelector(globeService, ({ context }) => context.paths);

  useEffect(() => {
    globeService.send({
      type: 'UPDATE_GLOBE_DOTS',
      dotDensity: 40,
      rows: 180,
    });
  }, [globeService]);

  useEffect(() => {
    globeService.send({
      type: 'UPDATE_MAX_PATHS',
      maxPaths: 10,
    });
  }, [globeService]);

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
