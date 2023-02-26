import { assign, createMachine, interpret, StateValueFrom } from 'xstate';
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

type GlobeMachineEvent =
  | { type: 'LOAD'; url: string }
  | SetMapDataEvent
  | UpdateGlobeDotsEvent;

type GlobeMachineContext = {
  dotDensity: number;
  rows: number;
  dotSize: number;
  mapSize?: MapSize;
  imageData?: ImageData;
  dotMesh?: InstancedMesh<CircleGeometry, MeshBasicMaterial>;
};

/** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYB06CGEAlgHZQDEAygKIAqA+gLICCACnQCJM1MDaADAF1EoAA5pYhAC6E0xYSAAeiAEwAWPtgDMARmUBWADQgAnom0A2AOzYAHAE5Ny5XYvm37gL4ejqTDjwAxtIAbmBkAKosnDRUdADiADIA8gBCsexJNBT8QkggYhLSsvJKCKraqthufNp65vpGpgg22th6Xt4gxGgQcPK+WPIFUjJyeaUAtOaNiFNePuhYuGgEJFBD4iPF44iqyjMIFtY25naWLu6X5vMgA-5BhKEbhaMlu9o2VdqWH5aGJmYbMpsHY9Dp9B0PEA */
const globeMachine = createMachine(
  {
    id: 'globe',
    tsTypes: {} as import('./globe.machine.typegen').Typegen0,
    schema: {
      events: {} as GlobeMachineEvent,
      context: {} as GlobeMachineContext,
    },
    predictableActionArguments: true,

    initial: 'loading',

    context: {
      dotDensity: 50,
      dotSize: 150,
      rows: 200,
    },

    states: {
      loading: {
        invoke: {
          src: 'fetchMap$',
        },
        on: {
          SET_MAP_DATA: {
            target: 'active',
            actions: 'setMapData',
          },
        },
      },

      active: {
        entry: 'plotGlobeDots',

        on: {
          UPDATE_GLOBE_DOTS: {
            actions: 'updateGlobeDots',
            target: 'active',
          },
        },
      },
    },
  },
  {
    actions: {
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
    },
    services: {
      fetchMap$: (): Observable<SetMapDataEvent> => {
        return fromImageLoad(mapUrl).pipe(
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
        );
      },
    },
  }
);

export type GlobeMachineStateValue = StateValueFrom<typeof globeMachine>;

export const globeService = interpret(globeMachine).start();
