import React, { useEffect } from 'react';
import { type Group } from 'three';
import { GroupProps } from '@react-three/fiber';
import { useInterpret, useSelector } from '@xstate/react';

import { Path } from './Path';
import { GlobeMachineStateValue, globeMachine } from '../services';

export type GlobeProps = {
  dotDensity?: number;
  rows?: number;
  maxPaths?: number;
  isPaused?: boolean;
} & GroupProps;

export const Globe = React.forwardRef<Group, GlobeProps>(function Globe(
  { dotDensity = 40, rows = 180, maxPaths = 10, isPaused = false, ...props },
  ref
) {
  const globeService = useInterpret(globeMachine);
  const dotMesh = useSelector(globeService, ({ context }) => context.dotMesh);
  const paths = useSelector(globeService, ({ context }) => context.paths);
  const value = useSelector(
    globeService,
    ({ toStrings }) => toStrings().slice(-1)[0] as GlobeMachineStateValue
  );

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

  useEffect(() => {
    if (/active|paused/.test(value)) {
      globeService.send({
        type: isPaused ? 'PAUSE' : 'PLAY',
      });
    }
  }, [globeService, isPaused, value]);

  return (
    <group ref={ref} {...props}>
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
});
