import React from 'react';
import { useSelector } from '@xstate/react';

import { PathActorRef } from '../services/path.machine';

type PathProps = {
  pathActorRef: PathActorRef;
};

export const Path: React.FC<PathProps> = React.memo(function Path(props) {
  const { pathActorRef } = props;
  const pathLine = useSelector(pathActorRef, (state) => state.context.pathLine);

  return <group>{pathLine && <primitive object={pathLine} />}</group>;
});
