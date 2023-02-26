import { DEG2RAD, RAD2DEG } from 'three/src/math/MathUtils';

// function courtesy of https://github.com/chrisveness/geodesy
export const calculateMidwayPoint = (
  lat1: number,
  long1: number,
  lat2: number,
  long2: number
) => {
  lat1 *= DEG2RAD;
  long1 *= DEG2RAD;
  lat2 *= DEG2RAD;
  long2 *= DEG2RAD;

  const deltaLong = long2 - long1;
  const Bx = Math.cos(lat2) * Math.cos(deltaLong);
  const By = Math.cos(lat2) * Math.sin(deltaLong);

  const midLat = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
  );
  const midLong = long1 + Math.atan2(By, Math.cos(lat1) + Bx);

  return [midLat * RAD2DEG, midLong * RAD2DEG];
};
