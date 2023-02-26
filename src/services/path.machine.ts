import { ActorRefFrom, createMachine } from 'xstate';
import { assign, sendParent } from 'xstate/lib/actions';
import { type Observable, animationFrames, map, scan, takeWhile } from 'rxjs';
import {
  CubicBezierCurve3,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three';

import { calculateMidwayPoint, latLongToCoords, normalize } from '../utils/lib';
import { type PathSpawnerEvent } from './pathSpawner.machine';

export type PathLocation = {
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
  pathId: string;
  startLocation: PathLocation;
  endLocation: PathLocation;

  arcHeightConfig: ArcHeightConfig;
  deRenderCount: number;
  renderCount: number;
  animationSpeed?: number;
  pathLine?: Mesh<TubeGeometry, MeshBasicMaterial>;
};

export const createPathMachine = ({
  pathId,
  startLocation,
  endLocation,
}: {
  pathId: string;
  startLocation: PathLocation;
  endLocation: PathLocation;
}) =>
  /** @xstate-layout N4IgpgJg5mDOIC5QAcCGAXAFgOgEYFcBLAGwkIDsoBiCAe3LGwoDdaBrRtLPI0iqBC1oBjDIXoBtAAwBdaTMQpasQunHlFIAB6IATADZ92KQHYpAZnMAOAJwBWG-qm67AGhABPPbqnYALHbmAIwBfrrmUnYm1gC+Me5cOAQkZJRUAKoACgAiAIIAKgCiAPoAQukAkgAy2fKayMqq6po6CCa62EGRAZYBZs5unohWQf424+NB7SY2Ula6cQkYOBBw6ABOtB78NPSMQhzYidirsBtb-ILkrKJqkrJ1SCANKncaT63649gmQVbTPgCQS+7i8CHCdmwgX0fhmUxswKsVkWz2WJzWm22aSyeSKxWyhQAyvkAEoAeQAmo8lK9mh9EH4rOZsPoZvp5nZ9IF-uY-KDEF0bFCmbygsEuiZ9OYFijyLRTvVlvVGm8WogALRBfkIdX6FHHZJ8SjK2n0NUIWHav4dezBPxheww2Z2fVo07nLFQE1NM30i1SzpSGzmSVI4Phcz6bW6IKjCwwqwwyzBvx6+Ko7hkWAvMDe1V+hF+bC6RxWOy6AIwyJWaNBn6Jvw2PzmYOWKRpuJAA */
  createMachine(
    {
      id: 'path',
      tsTypes: {} as import('./path.machine.typegen').Typegen0,
      initial: 'building',

      schema: {
        events: {} as PathMachineEvent,
        context: {} as PathMachineContext,
      },

      predictableActionArguments: true,

      context: {
        pathId,
        startLocation,
        endLocation,
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

          entry: 'init',
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
          type: 'final',
          entry: 'dispose',
        },
      },
    },
    {
      actions: {
        dispose: sendParent(
          ({ pathId }) =>
            ({
              type: 'DISPOSE_PATH',
              pathId,
            } as PathSpawnerEvent)
        ),
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
        init: assign(({ arcHeightConfig, startLocation, endLocation }) => {
          const startVector = new Vector3(
            ...latLongToCoords(startLocation.lat, startLocation.long, 1)
          );
          const endVector = new Vector3(
            ...latLongToCoords(endLocation.lat, endLocation.long, 1)
          );

          const tubeDistance = startVector.distanceTo(endVector);

          const arcHeight = normalize(
            tubeDistance,
            0,
            2,
            1,
            // eslint-disable-next-line no-nested-ternary
            tubeDistance > arcHeightConfig.thresholds.mediumToLong
              ? arcHeightConfig.heights.long
              : tubeDistance > arcHeightConfig.thresholds.shortToMedium
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
            ...latLongToCoords(midLat, midLong, arcHeight)
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
              color: 0xff00dc,
            })
          );

          pathLine.geometry.setDrawRange(0, 0);

          const animationSpeed =
            Math.ceil((18 * pathBezier.getLength()) / 9) * 3;

          return {
            animationSpeed,
            pathLine,
          };
        }),
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

export type PathActorRef = ActorRefFrom<ReturnType<typeof createPathMachine>>;
