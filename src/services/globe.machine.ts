import {
  assign,
  createMachine,
  forwardTo,
  SendAction,
  spawn,
  StateValueFrom,
} from 'xstate';
import { type Observable, map } from 'rxjs';
import {
  type Matrix4,
  Object3D,
  CircleGeometry,
  MeshBasicMaterial,
  DoubleSide,
  InstancedMesh,
} from 'three';
import { DEG2RAD } from 'three/src/math/MathUtils';

import mapUrl from '../assets/photos/map.png';
import { fromImageLoad } from '../utils/rxjs';
import { type MapSize, isDotVisible, latLongToCoords } from '../utils/lib';
import {
  type PathSpawnerActor,
  type PathWithId,
  type UpdateMaxPathsEvent,
  type UpdatePathsEvent,
  createPathSpawnerMachine,
} from './pathSpawner.machine';

type InitEvent = {
  type: 'INIT';
  maxPaths: number;
  dotDensity: number;
  rows: number;
};

type LoadEvent = {
  type: 'LOAD';
  url: string;
};

type SetMapDataEvent = {
  type: 'SET_MAP_DATA';
  mapSize: MapSize;
  imageData: ImageData;
};

type UpdateGlobeDotsEvent = {
  type: 'UPDATE_GLOBE_DOTS';
  dotDensity: number;
  rows: number;
};

type PlayEvent = { type: 'PLAY' };
type PauseEvent = { type: 'PAUSE' };

type GlobeMachineEvent =
  | InitEvent
  | LoadEvent
  | SetMapDataEvent
  | UpdateGlobeDotsEvent
  | UpdatePathsEvent
  | UpdateMaxPathsEvent
  | PlayEvent
  | PauseEvent;

type GlobeMachineContext = {
  dotDensity: number;
  rows: number;
  maxPaths: number;
  dotSize: number;
  paths: PathWithId[];
  mapSize?: MapSize;
  imageData?: ImageData;
  dotMesh?: InstancedMesh<CircleGeometry, MeshBasicMaterial>;
  pathSpawnerRef?: PathSpawnerActor;
};

/** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYB06CGEAlgHZQDEAygKIAqA+gLICCACnQCJM1MDaADAF1EoAA5pYhAC6E0xYSAAeiACwAmVdjUBGABwB2AGzKdBgMymtqgDQgAnoh1bsAVj5vLpvgE4ffXQF9-G1RMHEIIFDAyAEkAOWiafiEkEDEJaVl5JQRLZxc3dz4LIq8DG3sEL2VsL0NnHT5lU1VTL2dVQOD0LGw8AGNpADccFEJhsgBVFk4aKjoAcQAZAHkAITn2ZZoKJPk0qRk5FOytLTz1VQMDPgM9ZXd1csQvPh0ar1UtAy-mgy9TZSdEAhHr9IYjMZRKYzOYsLgACR2gj24gOmWOiC0rWwJj0WjaAJa9TuTwQjg0zlafmaLVMOmUeiBIJwYMhuEhk2mXDmzAAGnQ4TREbsUvsMkdQCddDVKZY9Ho+KoPgznKSDDovNgsao9Po-lplJZAUFgd0WQM2aNxnCJtQRaJUeKsog6QZsIqAa1jFobjpTKSfa5NJ8Gm0dI4FcauqFsCI8ABXWCQMgsRZMACa9tSjsOzoQBmsdhUZxqN0udyKRWcjKBxDQEDg8mZKPSuYxCAAtGUi52DEyzbg0AQSFAW2iJYpEOpqj7-kZ7oaGrrSVUZRY1K4-XpnMo+ybmdhwpEx0722oA9LlLKLDvyxrTP2Y6zhie25LEDvSTu+NgzKp6V8fCGF4j6ghawzsi+oo5ui745IqAZFHo2CtH6+hfLuVygea4LYAAFoQsCSGgABOFQOq2sGTvBhYVAWbzajoqg3NcZxYthsYJkmECvlR2TXBouovPK25XqYej+j2ygMpoVxaHoHztGc9LGoEQA */
export const globeMachine = createMachine(
  {
    id: 'globe',
    tsTypes: {} as import('./globe.machine.typegen').Typegen0,

    schema: {
      events: {} as GlobeMachineEvent,
      context: {} as GlobeMachineContext,
    },

    predictableActionArguments: true,
    initial: 'idle',

    context: {
      dotDensity: 50,
      dotSize: 150,
      rows: 200,
      maxPaths: 10,
      paths: [],
    },

    states: {
      loading: {
        invoke: {
          src: 'fetchMap$',
        },
        on: {
          SET_MAP_DATA: {
            target: 'active.live',
            actions: ['setMapData', 'plotGlobeDots'],
          },
        },
      },

      idle: {
        on: {
          INIT: {
            target: 'loading',
            actions: 'init',
          },
        },
      },

      active: {
        initial: 'live',

        states: {
          live: {
            on: {
              UPDATE_GLOBE_DOTS: {
                actions: ['updateGlobeDots', 'plotGlobeDots'],
                target: 'live',
                internal: true,
              },

              UPDATE_PATHS: {
                target: 'live',
                internal: true,
                actions: 'updatePaths',
              },

              UPDATE_MAX_PATHS: {
                target: 'live',
                internal: true,
                actions: ['updateMaxPaths', 'forwardToPathSpawner'],
              },

              PAUSE: {
                target: '#globe.paused',
                actions: 'forwardToPathSpawner',
              },
            },

            entry: 'spawnPathSpawner',
            exit: 'disposePathSpawner',
          },

          history: {
            type: 'history',
            history: 'shallow',
          },
        },
      },

      paused: {
        on: {
          PLAY: {
            target: 'active.history',
            actions: 'forwardToPathSpawner',
          },
        },
      },
    },
  },
  {
    actions: {
      init: assign((_, { dotDensity, rows, maxPaths }) => ({
        dotDensity,
        rows,
        maxPaths,
      })),
      setMapData: assign((_, { mapSize, imageData }) => ({
        mapSize,
        imageData,
      })),
      updateGlobeDots: assign((_, { dotDensity, rows }) => ({
        dotDensity,
        rows,
      })),
      plotGlobeDots: assign(
        ({
          rows,
          dotDensity,
          dotSize,
          mapSize,
          imageData,
          dotMesh: prevDotMesh,
        }) => {
          if (!mapSize) throw new Error('Missing map size');
          if (!imageData) throw new Error('Missing image data');
          if (prevDotMesh) {
            prevDotMesh.geometry.dispose();
            prevDotMesh.material.dispose();
          }
          const dotMatrices: Matrix4[] = [];
          for (let lat = -90; lat <= 90; lat += 180 / rows) {
            const radius = Math.cos(Math.abs(lat) * DEG2RAD);
            const circumference = radius * Math.PI * 2;
            const dotsForLat = circumference * dotDensity;
            const tempDot = new Object3D();

            for (let x = 0; x < dotsForLat; x += 1) {
              const long = -180 + (x * 360) / dotsForLat;

              if (!isDotVisible(lat, long, mapSize, imageData)) {
                continue;
              }

              const positions = latLongToCoords(lat, long, 1);

              tempDot.position.set(positions[0], positions[1], positions[2]);

              const lookAtPositions = latLongToCoords(lat, long, 6);
              tempDot.lookAt(
                lookAtPositions[0],
                lookAtPositions[1],
                lookAtPositions[2]
              );
              tempDot.updateMatrix();
              const matrix = tempDot.matrix.clone();

              dotMatrices.push(matrix);
            }
          }

          const dotRadius = 1 / dotSize;
          const circleGeometry = new CircleGeometry(dotRadius, 5);
          const circleMaterial = new MeshBasicMaterial({
            color: 0xff00dc,
          });
          circleMaterial.side = DoubleSide;

          const dotMesh = new InstancedMesh(
            circleGeometry,
            circleMaterial,
            dotMatrices.length
          );

          dotMatrices.forEach((dotMatrix, i) => {
            dotMesh.setMatrixAt(i, dotMatrix);
          });
          dotMesh.renderOrder = 3;

          return {
            dotMesh,
          };
        }
      ),
      spawnPathSpawner: assign(({ pathSpawnerRef, maxPaths }) => {
        // if (pathSpawnerRef) pathSpawnerRef.stop?.();
        if (!pathSpawnerRef) {
          const pathSpawner = spawn(
            createPathSpawnerMachine(maxPaths),
            'pathSpawner'
          );
          return {
            pathSpawnerRef: pathSpawner,
          };
        }

        return {};
      }),
      disposePathSpawner: assign(({ pathSpawnerRef }, { type }) => {
        if (!pathSpawnerRef) throw new Error('Missing path spawner actor');
        if (type === 'PAUSE') return {};
        pathSpawnerRef.stop?.();

        return {
          pathSpawnerRef: undefined,
        };
      }),
      updatePaths: assign((_, { paths }) => ({ paths })),
      updateMaxPaths: assign((_, { maxPaths }) => ({
        maxPaths,
      })),
      forwardToPathSpawner: forwardTo('pathSpawner') as SendAction<
        any,
        any,
        any
      >,
    },
    services: {
      fetchMap$: (): Observable<SetMapDataEvent> =>
        fromImageLoad(mapUrl).pipe(
          map<HTMLImageElement, SetMapDataEvent>((image) => {
            const mapSize = {
              width: image.width,
              height: image.height,
            };

            // Create a canvas element
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = mapSize.width;
            imgCanvas.height = mapSize.height;

            // Get the drawing context
            const imgCtx = imgCanvas.getContext('2d');
            if (!imgCtx) throw new Error('Cannot get 2d rendering context');

            imgCtx.drawImage(image, 0, 0);

            const imageData = imgCtx.getImageData(
              0,
              0,
              mapSize.width,
              mapSize.height
            );

            return {
              type: 'SET_MAP_DATA',
              mapSize,
              imageData,
            };
          })
        ),
    },
  }
);

export type GlobeMachineStateValue = StateValueFrom<typeof globeMachine>;
