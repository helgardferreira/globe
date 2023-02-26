import { useControls } from 'leva';

export const useGlobeControls = () => {
  return useControls({
    dotDensity: {
      max: 80,
      min: 1,
      step: 1,
      value: 50,
    },
    rows: {
      max: 360,
      min: 1,
      step: 1,
      value: 200,
    },
    maxPaths: {
      max: 100,
      min: 1,
      step: 1,
      value: 10,
    },
  });
};
