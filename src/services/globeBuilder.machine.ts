import { assign, createMachine, interpret } from 'xstate';
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
import {
  type MapSize,
  isDotVisible,
  latLongToVec3 as latLongToPositions,
} from '../utils/lib';

type SetMapDataEvent = {
  type: 'SET_MAP_DATA';
  mapSize: MapSize;
  imageData: ImageData;
};

type UpdateGlobeDotsEvent = {
  type: 'UPDATE_GLOBE_DOTS';
  dotDensity: number;
  globeRadius: number;
  rows: number;
};

type GlobeBuilderMachineEvent =
  | { type: 'LOAD'; url: string }
  | SetMapDataEvent
  | UpdateGlobeDotsEvent;

type GlobeBuilderMachineContext = {
  dotDensity: number;
  globeRadius: number;
  rows: number;
  dotSize: number;
  mapSize?: MapSize;
  imageData?: ImageData;
  dotMesh?: InstancedMesh<CircleGeometry, MeshBasicMaterial>;
};

/** @xstate-layout N4IgpgJg5mDOIC5QFsCGAHAMge1RMATgHQA2uEAlgHZQDEAygKIAqA+gLICCACqwCKdmnANoAGALqJQ6bLAoAXCtipSQAD0QAmACyiiAZgCMmgKyiAbAA4AnKNMB2UfoA0IAJ6JD5+0Rv7N+tq2lvaG+tbmAL6RrmhY5IREqADGigBuYLQAqtwCzIysAOKYAPIAQgV8Jcz0YpJIIDJyisqqGgjahtpE5uaihvY6+lai2uauHgiWhkQm0TEgVNj48A1xOHiEqk0KSioN7QC04+6Ix9GxGBv4xGR41FDbsrutB4jamhOe3r7m1vYRXRhez2EyWC4gdYJYgpdJgJ7NPZtd6GSw9AaaJxWEZjL4IVGaIjWExGUzzSJAA */
const globeBuilderMachine = createMachine(
  {
    id: 'globeBuilder',
    tsTypes: {} as import('./globeBuilder.machine.typegen').Typegen0,
    schema: {
      events: {} as GlobeBuilderMachineEvent,
      context: {} as GlobeBuilderMachineContext,
    },
    predictableActionArguments: true,

    initial: 'loading',

    context: {
      rows: 200,
      dotDensity: 50,
      globeRadius: 1,
      dotSize: 150,
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
      updateGlobeDots: assign((_, { dotDensity, globeRadius, rows }) => ({
        dotDensity,
        globeRadius,
        rows,
      })),
      plotGlobeDots: assign(
        ({
          rows,
          globeRadius,
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
            const radius = Math.cos(Math.abs(lat) * DEG2RAD) * globeRadius;
            const circumference = radius * Math.PI * 2;
            const dotsForLat = circumference * dotDensity;
            const tempDot = new Object3D();

            for (let x = 0; x < dotsForLat; x += 1) {
              const long = -180 + (x * 360) / dotsForLat;

              if (!isDotVisible(lat, long, mapSize, imageData)) {
                continue;
              }

              const positions = latLongToPositions(lat, long, globeRadius);

              tempDot.position.set(positions[0], positions[1], positions[2]);

              const lookAtPositions = latLongToPositions(
                lat,
                long,
                globeRadius + 5
              );
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

          const dotRadius = globeRadius / dotSize;
          const circleGeometry = new CircleGeometry(dotRadius, 5);
          const circleMaterial = new MeshBasicMaterial({
            color: 0xff0000,
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

export const globeBuilderService = interpret(globeBuilderMachine).start();
