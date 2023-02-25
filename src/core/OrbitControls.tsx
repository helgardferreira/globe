import {
  EventManager,
  ReactThreeFiber,
  useFrame,
  useThree,
} from '@react-three/fiber';
import React, { useMemo, useEffect } from 'react';
import type { Camera, Event } from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls';

export type OrbitControlsChangeEvent = Event & {
  target: EventTarget & { object: Camera };
};

export type OrbitControlsProps = Omit<
  ReactThreeFiber.Overwrite<
    ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
    {
      camera?: Camera;
      domElement?: HTMLElement;
      enableDamping?: boolean;
      makeDefault?: boolean;
      target?: ReactThreeFiber.Vector3;
    }
  >,
  'ref'
>;

export const OrbitControls = React.forwardRef<
  OrbitControlsImpl,
  OrbitControlsProps
>(function OrbitControls(
  { makeDefault, camera, domElement, enableDamping = true, ...restProps },
  ref
) {
  const defaultCamera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const events = useThree((state) => state.events) as EventManager<HTMLElement>;
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const explCamera = camera || defaultCamera;
  const explDomElement = (domElement ||
    events.connected ||
    gl.domElement) as HTMLElement;
  const controls = useMemo(
    () => new OrbitControlsImpl(explCamera, explDomElement),
    [explCamera, explDomElement]
  );

  useFrame(() => {
    if (controls.enabled) controls.update();
  }, -1);

  useEffect(() => {
    return () => void controls.dispose();
  }, [explDomElement, controls]);

  useEffect(() => {
    if (makeDefault) {
      const old = get().controls;
      set({ controls });
      return () => set({ controls: old });
    }
  }, [get, set, makeDefault, controls]);

  return (
    <primitive
      ref={ref}
      object={controls}
      enableDamping={enableDamping}
      {...restProps}
    />
  );
});
