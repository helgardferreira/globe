import { useControls } from 'leva';

export const useGlobeControls = () => {
  return useControls({
    dotDensity: {
      max: 100,
      min: 1,
      step: 1,
      value: 50,
    },
    dotOffset: {
      max: 1.5,
      min: 0,
      value: 0,
    },
    globeRadius: {
      max: 1.4,
      min: 1,
      value: 1,
    },
    rows: {
      max: 1000,
      min: 1,
      step: 1,
      value: 200,
    },
  });
};
