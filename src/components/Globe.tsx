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

  const { dotDensity, dotOffset, globeRadius, rows, maxPaths } =
    useGlobeControls();

  useEffect(() => {
    globeService.send({
      type: 'UPDATE_GLOBE_DOTS',
      dotDensity,
      dotOffset,
      globeRadius,
      rows,
    });
  }, [dotDensity, dotOffset, globeRadius, rows, globeService]);

  useEffect(() => {
    pathSpawnerService.send({
      type: 'UPDATE_MAX_PATHS',
      value: maxPaths,
    });
  }, [maxPaths, pathSpawnerService]);

  return (
    <group rotation={[0, 290 * DEG2RAD, 0]}>
      <group scale={[globeRadius, globeRadius, globeRadius]}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color={0xffffff} />
        </mesh>
        {paths.map(({ id, pathActorRef }) => (
          <Path key={id} pathActorRef={pathActorRef} />
        ))}
      </group>
      {dotMesh && <primitive object={dotMesh} />}
    </group>
  );
};
