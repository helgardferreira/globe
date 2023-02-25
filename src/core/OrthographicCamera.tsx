import { useLayoutEffect, useRef, FunctionComponent } from 'react';
import { OrthographicCamera as OrthographicCameraImpl, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';

type Props = Omit<JSX.IntrinsicElements['orthographicCamera'], 'children'>;

export const OrthographicCamera: FunctionComponent<Props> = ({ ...props }) => {
  const set = useThree(({ set }) => set);
  const camera = useThree(({ camera }) => camera);
  const size = useThree(({ size }) => size);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const cameraRef = useRef<OrthographicCameraImpl>(null!);

  useLayoutEffect(() => {
    cameraRef.current.updateProjectionMatrix();
  }, [size]);

  useLayoutEffect(() => {
    cameraRef.current.updateProjectionMatrix();
  });

  useLayoutEffect(() => {
    camera.lookAt(new Vector3(0, 0, 0));
  }, [camera]);

  useLayoutEffect(() => {
    const oldCam = camera;
    set(() => ({ camera: cameraRef.current }));
    return () => set(() => ({ camera: oldCam }));
    // The camera should not be part of the dependency list because this
    // components camera is a stable reference that must exchange the default,
    // and clean up after itself on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, cameraRef]);

  return (
    <orthographicCamera
      left={size.width / -2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={size.height / -2}
      ref={cameraRef}
      far={2000}
      near={0.1}
      {...props}
    />
  );
};
