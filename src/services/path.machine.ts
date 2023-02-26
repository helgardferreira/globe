import { assign, createMachine } from 'xstate';
import {
  CubicBezierCurve3,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three';

import { calculateMidwayPoint, latLongToCoords, normalize } from '../utils/lib';

type PathLocation = {
  country: string;
  region: string;
  city: string;
  lat: number;
  long: number;
  population: number;
};

type PathMachineEvent =
  | {
      type: 'INIT';
      startLocation: PathLocation;
      endLocation: PathLocation;
      globeRadius: number;
    }
  | { type: 'UPDATE' };

type ArcHeightConfig = {
  thresholds: {
    mediumToLong: number;
    shortToMedium: number;
  };
  heights: {
    short: number;
    medium: number;
    long: number;
  };
};

type PathMachineContext = {
  arcHeightConfig: ArcHeightConfig;
  startLocation?: PathLocation;
  endLocation?: PathLocation;
  globeRadius?: number;
  pathLine?: Mesh<TubeGeometry, MeshBasicMaterial>;
};

export const pathMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QAcCGAXAFgOgJYQBswBiASQDlSAVAbQAYBdRFAe1l3VxYDtmQAPRAEYATAFZsYgDQgAnsLoA2bCIDsAZgAs61WIC+emWizZUAY04A3EgFUACgBEAglQCi9JkhDI2HLry9BBBEhAE5sITpQnWk5RAAOIUkDQxBuFgg4PmNMbN9OHj4ggFpFGXkEUoMjDBx8Ijz2AoDQIM0RcuERcN1q71rTC1xrRr9CwMQREXjsVUTxToQhHRS9IA */
  createMachine(
    {
      id: 'path',
      tsTypes: {} as import('./path.machine.typegen').Typegen0,
      schema: {
        events: {} as PathMachineEvent,
        context: {} as PathMachineContext,
      },
      predictableActionArguments: true,

      context: {
        arcHeightConfig: {
          thresholds: {
            mediumToLong: 1.8,
            shortToMedium: 1.2,
          },
          heights: {
            short: 1.3,
            medium: 1.53,
            long: 1.83,
          },
        },
      },

      states: {
        idle: {
          on: {
            INIT: {
              target: 'active',
              actions: 'init',
            },
          },
        },

        active: {
          on: {
            UPDATE: {
              target: 'active',
              internal: true,
            },
          },
        },
      },

      initial: 'idle',
    },
    {
      actions: {
        init: assign(
          (
            { arcHeightConfig },
            { startLocation, endLocation, globeRadius }
          ) => {
            const startVector = new Vector3(
              ...latLongToCoords(
                startLocation.lat,
                startLocation.long,
                globeRadius
              )
            );
            const endVector = new Vector3(
              ...latLongToCoords(endLocation.lat, endLocation.long, globeRadius)
            );

            const tubeDistance = startVector.distanceTo(endVector);

            const arcHeight = normalize(
              tubeDistance,
              0,
              2 * globeRadius,
              globeRadius,
              // eslint-disable-next-line no-nested-ternary
              tubeDistance >
                arcHeightConfig.thresholds.mediumToLong * globeRadius
                ? arcHeightConfig.heights.long
                : tubeDistance >
                  arcHeightConfig.thresholds.shortToMedium * globeRadius
                ? arcHeightConfig.heights.medium
                : arcHeightConfig.heights.short
            );

            const [midLat, midLong] = calculateMidwayPoint(
              startLocation.lat,
              startLocation.long,
              endLocation.lat,
              endLocation.long
            );

            const midVector = new Vector3(
              ...latLongToCoords(midLat, midLong, globeRadius * arcHeight)
            );

            const controlPoint1 = new Vector3().copy(midVector);
            const controlPoint2 = new Vector3().copy(midVector);

            const t1 = 0.15;
            const t2 = 0.85;

            const interimBezier = new CubicBezierCurve3(
              startVector,
              controlPoint1,
              controlPoint2,
              endVector
            );

            interimBezier.getPoint(t1, controlPoint1);
            interimBezier.getPoint(t2, controlPoint2);
            controlPoint1.multiplyScalar(arcHeight);
            controlPoint2.multiplyScalar(arcHeight);

            const pathBezier = new CubicBezierCurve3(
              startVector,
              controlPoint1,
              controlPoint2,
              endVector
            );

            const tubeSegmentLength = Math.trunc(100 * pathBezier.getLength());
            const pathLine = new Mesh(
              new TubeGeometry(pathBezier, tubeSegmentLength, 0.004, 3, false),
              new MeshBasicMaterial({
                color: 0x0000ff,
              })
            );

            return {
              startLocation,
              endLocation,
              globeRadius,
              pathLine,
            };
          }
        ),
      },
    }
  );
