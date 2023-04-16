import React, { useEffect } from 'react';
import { GroupProps } from '@react-three/fiber';
import { useInterpret, useSelector } from '@xstate/react';
import { DEG2RAD } from 'three/src/math/MathUtils';

import { Path } from './Path';
import { globeMachine } from '../services';

export type GlobeProps = {
  dotDensity?: number;
  rows?: number;
  maxPaths?: number;
} & GroupProps;

export const Globe: React.FC<GlobeProps> = ({
  dotDensity = 40,
  rows = 180,
  maxPaths = 10,
  ...props
}) => {
  const globeService = useInterpret(globeMachine);
  const dotMesh = useSelector(globeService, ({ context }) => context.dotMesh);
  const paths = useSelector(globeService, ({ context }) => context.paths);

  useEffect(() => {
    globeService.send({
      type: 'INIT',
      dotDensity,
      rows,
      maxPaths,
    });
  }, [dotDensity, globeService, maxPaths, rows]);

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
      maxPaths,
    });
  }, [globeService, maxPaths]);

  return (
    <group rotation={[0, 290 * DEG2RAD, 0]} {...props}>
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
