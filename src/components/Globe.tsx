import { useEffect } from 'react';
import { useSelector } from '@xstate/react';
import { DEG2RAD } from 'three/src/math/MathUtils';

import { useServices } from '../GlobalStateProvider';
import { useGlobeControls } from '../utils/hooks';
import { Path } from './Path';

export const Globe = () => {
  const { globeService, pathSpawnerService } = useServices();
  const dotMesh = useSelector(globeService, (state) => state.context.dotMesh);
  const paths = useSelector(pathSpawnerService, (state) => state.context.paths);

  const { dotDensity, rows, maxPaths } = useGlobeControls();

  useEffect(() => {
    globeService.send({
      type: 'UPDATE_GLOBE_DOTS',
      dotDensity,
      rows,
    });
  }, [dotDensity, rows, globeService]);

  useEffect(() => {
    pathSpawnerService.send({
      type: 'UPDATE_MAX_PATHS',
      value: maxPaths,
    });
  }, [maxPaths, pathSpawnerService]);

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
