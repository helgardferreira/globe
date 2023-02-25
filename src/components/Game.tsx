import { Globe } from './Globe';

export const Game = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[-20, 20, 20]} />
      <Globe />
    </>
  );
};
