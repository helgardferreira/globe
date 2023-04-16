import { type ActorRef, createMachine } from 'xstate';
import { assign } from 'xstate/lib/actions';
import { type Observable, fromEvent, map, mergeMap, takeUntil } from 'rxjs';
import { type Object3D, Vector2, Euler } from 'three';

type RotateControlsMachineContext = {
  animateSpeed: number;
  domElement?: HTMLElement;

  panStartRef: Vector2;
  panEndRef: Vector2;
  panDeltaRef: Vector2;
  rotationRef: Euler;

  panSpeed: number;

  object?: Object3D;

  moveRef$?: ActorRef<any, any>;
  stopMovingRef$?: ActorRef<any, any>;
};

type InitEvent = { type: 'INIT'; object: Object3D; domElement: HTMLElement };
type UpdateEvent = { type: 'UPDATE' };
type StartAnimateEvent = { type: 'START_ANIMATE' };
type AnimateEvent = { type: 'ANIMATE'; timeDelta: number };
type PanStartEvent = { type: 'PAN_START'; data: PointerEvent };
type PanMoveEvent = { type: 'PAN_MOVE'; data: PointerEvent };
type PanEndEvent = { type: 'PAN_END' };

type RotateControlsMachineEvent =
  | InitEvent
  | UpdateEvent
  | StartAnimateEvent
  | AnimateEvent
  | PanStartEvent
  | PanMoveEvent
  | PanEndEvent;

const pointerMove$ = fromEvent<PointerEvent>(window, 'pointermove');
const pointerUp$ = fromEvent<PointerEvent>(window, 'pointerup');

/** @xstate-layout N4IgpgJg5mDOIC5QCcD2AXAhusBhVAdumgDawB0AlhCWAMQCSAcgwCoDaADALqKgAOqWJXSVCfEAA9EARgBMANgA0IAJ6IArHLnkA7AA4AnJ10BmQwBYLnQzP0BfeyrRYc+IqQqYAxqIBu9AAKAIJMAPoAokwAIly8SCCCwqLiCdII1rrknPoahqa6GirqCOYa5PryGjIyVta2Dk4gLth4hMSoZOQ+-kGhYQCyAPIAahFxEkkiYgQS6dac5KZylXJFaohyZuTWCoq1VjZ2js4Yre4dXT2UAXQAqoHRwazjPJNC06mg8zUVeQXrEoyXRZCwaUzyGq5UycLamE7NM5udqebq+G59cIAZVYwQAShw3gkpilZmlEOZ9OQ5HZCsVEJUdoZmYYFHZwbCzI4mgRUBA4BIWsiPJ14MSPqS5ogALTKDYIWUIoVtEVdai0d7JGZSjJyekIDQWBTZGQaBSmBR1I6NU6uFWXLzogKaz5k76bOQWcgKGwA-UWVl6BRmi1Whrc+xAA */
export const rotateControlsMachine = createMachine(
  {
    id: 'rotateControls',
    predictableActionArguments: true,

    schema: {
      events: {} as RotateControlsMachineEvent,
      context: {} as RotateControlsMachineContext,
    },

    context: {
      animateSpeed: 10,
      panStartRef: new Vector2(),
      panEndRef: new Vector2(),
      panDeltaRef: new Vector2(),
      rotationRef: new Euler(),

      panSpeed: 0.01,
    },

    tsTypes: {} as import('./rotateControls.machine.typegen').Typegen0,

    initial: 'idle',
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
        description: `The panning.active state represents the rotate controls
          is ready to receive user input.
          Instead of having multiple states for each interaction we have one
          state for animations later on.`,

        on: {
          PAN_END: {
            target: 'active',
            actions: 'panEnd',
            internal: true,
          },

          PAN_MOVE: {
            actions: ['pan', 'update'],
          },

          UPDATE: {
            actions: 'update',
          },

          PAN_START: {
            target: 'active',
            actions: 'panStart',
            internal: true,
          },
        },

        invoke: [
          {
            src: 'panMove$',
          },
          {
            src: 'panStart$',
          },
          {
            src: 'panEnd$',
          },
        ],
      },
    },
  },
  {
    actions: {
      init: assign((_, { object, domElement }) => ({
        rotationRef: object.rotation.clone(),
        object,
        domElement,
      })),
      update: ({ panDeltaRef, rotationRef, object }) => {
        rotationRef.y += panDeltaRef.x;

        panDeltaRef.set(0, 0);

        if (object) {
          object.rotation.copy(rotationRef);
        }
      },
      panStart: ({ panStartRef }, { data }) => {
        panStartRef.set(data.clientX, data.clientY);
      },
      pan: ({ panStartRef, panEndRef, panDeltaRef, panSpeed }, { data }) => {
        panEndRef.set(data.clientX, data.clientY);

        panDeltaRef.subVectors(panEndRef, panStartRef).multiplyScalar(panSpeed);

        panStartRef.copy(panEndRef);
      },
      panEnd: ({ panStartRef }) => {
        panStartRef.set(0, 0);
      },
    },
    services: {
      panStart$: ({ domElement }): Observable<PanStartEvent> => {
        if (!domElement) throw new Error('DOM element is not defined');

        return fromEvent<PointerEvent>(domElement, 'pointerdown').pipe(
          map((event) => ({ type: 'PAN_START', data: event }))
        );
      },
      panMove$: ({ domElement }): Observable<PanMoveEvent> => {
        if (!domElement) throw new Error('DOM element is not defined');

        return fromEvent<PointerEvent>(domElement, 'pointerdown').pipe(
          mergeMap(() => pointerMove$.pipe(takeUntil(pointerUp$))),
          map((event) => ({ type: 'PAN_MOVE', data: event }))
        );
      },
      panEnd$: (): Observable<PanEndEvent> =>
        pointerUp$.pipe(map(() => ({ type: 'PAN_END' }))),
    },
  }
);
