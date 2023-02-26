import { assign, createMachine } from 'xstate';
import { type Observable, animationFrames, map, scan, takeWhile } from 'rxjs';
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

type UpdateBuildEvent = { type: 'UPDATE_BUILD'; renderCount: number };
type UpdateDestroyEvent = { type: 'UPDATE_DESTROY'; deRenderCount: number };

type PathMachineEvent =
  | {
      type: 'INIT';
      startLocation: PathLocation;
      endLocation: PathLocation;
      globeRadius: number;
    }
  | UpdateBuildEvent
  | UpdateDestroyEvent;

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
  deRenderCount: number;
  renderCount: number;
  startLocation?: PathLocation;
  endLocation?: PathLocation;
  globeRadius?: number;
  animationSpeed?: number;
  pathLine?: Mesh<TubeGeometry, MeshBasicMaterial>;
};

export const pathMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QAcCGAXAFgOgJYQBswBiASQDlSAVAbQAYBdRFAe1l3VxYDtmQAPRAEYATAFZsYutOlC6AdgDMigCwBORQBoQAT2EA2edgAcGkSrqLziuvsUBfe9rRZsAIwCuuAhFzcoxBA8YHjcAG4sANYhLjie3r7+CH4RAMYYXNz0DNl8yGwcmXyCCCoqithC8mr6aurGVnTG+tp6CCIK2CpiikKKzWry+ioN8o7OGHFePn4BAKoACgAiAIJUAKIA+gBCc6QAMku5SCD57Jw8xYjmatgiQiM9ykJi8nTdrYjGQl1qf3UvBRiKoicanSbYCBwdAAJxYOlmgWCoQi0WwsUh0LhCKSKRY6QuWUYx1Y5yKJxKxiGJhE3zKSjUIn0Ii0umuIhEkkUwxq3yEL1UxjBGKhsFh8MRi1WG02S3WAGUqAAlADyAE0SacCoSrgh9Po6Nh5KYFPohLUREohJ8EDVJA1FEpqs0xGZHE4QNwWKK8pM8tryaASgBaFpshDBiT-aMxv4OD0Y-BEf1ky4UxAqEQ2oRqH7ctTGFm9UTGYwqYUQ+IzfwpwppoPslSVOgafTGMRlYZDLPhoSF7BqHoPOh9h5SMRiCuuUXinFQWs69N6ix3PvyMTGJr6-pqbMF7CWLuGA0T4tTnC+WBnMALwMCYQtn4WZmvWmDnryPfGA-clRDIZ0Ke-LuvYQA */
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
        deRenderCount: 0,
        renderCount: 0,
      },

      states: {
        idle: {
          on: {
            INIT: {
              target: 'building',
              actions: 'init',
            },
          },
        },

        building: {
          invoke: {
            src: 'animateBuild$',
            onDone: 'destroying',
          },

          on: {
            UPDATE_BUILD: {
              target: 'building',
              internal: true,
              actions: 'updateBuild',
            },
          },
        },

        destroying: {
          invoke: {
            src: 'animateDestroy$',
            onDone: 'dispose',
          },

          on: {
            UPDATE_DESTROY: {
              target: 'destroying',
              internal: true,
              actions: 'updateDestroy',
            },
          },
        },

        dispose: {
          entry: () => {
            console.log('dispose!');
          },
        },
      },

      initial: 'idle',
    },
    {
      actions: {
        updateBuild: assign(({ pathLine }, { renderCount }) => {
          if (!pathLine) throw new Error('Missing path line');

          pathLine.geometry.setDrawRange(0, renderCount);

          return {
            renderCount,
          };
        }),
        updateDestroy: assign(({ pathLine }, { deRenderCount }) => {
          if (!pathLine) throw new Error('Missing path line');

          pathLine.geometry.setDrawRange(deRenderCount, Infinity);

          return {
            deRenderCount,
          };
        }),
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

            pathLine.geometry.setDrawRange(0, 0);

            const animationSpeed =
              Math.ceil((18 * pathBezier.getLength()) / 9) * 3;

            return {
              startLocation,
              endLocation,
              globeRadius,
              animationSpeed,
              pathLine,
            };
          }
        ),
      },
      services: {
        animateBuild$: ({
          pathLine,
          animationSpeed,
        }): Observable<UpdateBuildEvent> => {
          if (pathLine === undefined) throw new Error('Missing path line');
          if (animationSpeed === undefined)
            throw new Error('Missing animation speed');

          return animationFrames().pipe(
            scan((renderCount) => renderCount + animationSpeed, 0),
            map(
              (renderCount) =>
                ({
                  type: 'UPDATE_BUILD',
                  renderCount,
                } as UpdateBuildEvent)
            ),
            takeWhile(({ renderCount }) => {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              return renderCount <= pathLine.geometry.index!.count;
            })
          );
        },
        animateDestroy$: ({
          pathLine,
          animationSpeed,
        }): Observable<UpdateDestroyEvent> => {
          if (pathLine === undefined) throw new Error('Missing path line');
          if (animationSpeed === undefined)
            throw new Error('Missing animation speed');

          return animationFrames().pipe(
            scan((deRenderCount) => deRenderCount + animationSpeed, 0),
            map(
              (deRenderCount) =>
                ({
                  type: 'UPDATE_DESTROY',
                  deRenderCount,
                } as UpdateDestroyEvent)
            ),
            takeWhile(({ deRenderCount }) => {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              return deRenderCount <= pathLine.geometry.index!.count;
            })
          );
        },
      },
    }
  );
