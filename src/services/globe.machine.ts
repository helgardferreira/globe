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

/** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYB06CGEAlgHZQDEAygKIAqA+gLICCACnQCJM1MDaADAF1EoAA5pYhAC6E0xYSAAeiACwAmVdjUBGABwB2AMwA2HQZ1G1AGhABPRDq3YArH1d8tRp3r7KjerQC+AdaomDiEEChgZACSAHIxNPxCSCBiEtKy8koIWqpOmgCcxYV6Fk6qfAZ8TtZ2CIXK2KWenuZaaoXuQSHoWNh4AMbSAG44KIRjZACqLJw0VHQA4gAyAPIAQovsazQUyfLpUjJyqTlaWgXqqp6FRsYGBloGdYhdOs2Fqlp66j-eBh6IFC-SGo3Gk2is3mixYXAAEvtBIdxMcsmdEM9CthzP5GspCgZSqplK8EA4NE4iT53JUdBVVECQTgwZDcJCZnMuItmAANOhwmiIg6pI6ZU6gc66ZpUi5GPg6GoOHSqMkmbHPVSmR56ZTKBXKJl9FnDNkTKZw6bUEWiVHi7KIMxGbB8VQGZQVJy6InmMlaGp8TTfL7mHS+S5OI1hbAiPAAV1gkDILBWTAAmja0naTg6EEZVbYVJdmnx8-mPDd84ygcQ0BA4PJmSiMjmMQgALRGMmdl1uPv9vh6KP9fBEUjNtESxSIdRNf2EvzfYx+HRkxoyp43ElGDra4fhSJgCf2ttWQu5aUep4GFxeExhofBYHGgamsbH1uSxBOUnnn+B+4tSAi4FTKfdX3Bdl31FbN0S-XJXT9Ko9GwH1lHMdCSS6atemjVkxmwAALQhYEkNAACd6ltFs4OnBCC3qfMPk1cx3T8HcjCMcDYwTSAP1onJ5Q0PQdHeZQtEaf0nFXc89RQ3wdycQoPGqXwqiCIIgA */
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

export type GlobeMachineStateValue = Exclude<
  StateValueFrom<typeof globeMachine>,
  object
>;
