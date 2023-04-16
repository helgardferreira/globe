import { useEffect } from 'react';
import { type Object3D } from 'three';
import { useThree } from '@react-three/fiber';
import { useInterpret } from '@xstate/react';

import { rotateControlsMachine } from '../services/rotateControls.machine';

type RotateControlsProps = {
  object: Object3D;
};

const RotateControls: React.FC<RotateControlsProps> = (props) => {
  const { object } = props;
  const domElement = useThree(({ gl }) => gl.domElement);
  const rotateControlsService = useInterpret(rotateControlsMachine);

  useEffect(() => {
    rotateControlsService.send({
      type: 'INIT',
      domElement,
      object,
    });
  }, [domElement, object, rotateControlsService]);

  return <primitive object={rotateControlsService} />;
};

export default RotateControls;
