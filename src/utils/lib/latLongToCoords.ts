import { DEG2RAD } from 'three/src/math/MathUtils';

export const latLongToCoords = (lat: number, long: number, radius: number) => {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (long + 180) * DEG2RAD;

  return [
    radius * Math.sin(phi) * Math.cos(theta) * -1,
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
};
