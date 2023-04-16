import { type ActorRef, createMachine, spawn } from 'xstate';
import { assign } from 'xstate/lib/actions';
import { type Observable, fromEvent, map, mergeMap, takeUntil } from 'rxjs';
import { type Object3D, Vector2, Euler } from 'three';

type RotateControlsMachineContext = {
  animateSpeed: number;
  domElement: HTMLElement;

  panStartRef: Vector2;
  panEndRef: Vector2;
  panDeltaRef: Vector2;
  rotationRef: Euler;
  lastRotationRef: Euler;

  panSpeed: number;
  EPS: number;

  object?: Object3D;

  moveRef$?: ActorRef<any, any>;
  stopMovingRef$?: ActorRef<any, any>;
};

type InitEvent = { type: 'INIT'; object: Object3D; domElement: HTMLElement };
type UpdateEvent = { type: 'UPDATE' };
type StartAnimateEvent = { type: 'START_ANIMATE' };
type AnimateEvent = { type: 'ANIMATE'; timeDelta: number };
type PanMoveEvent = { type: 'PAN_MOVE'; data: PointerEvent };
type PanEndEvent = { type: 'PAN_END' };

type RotateControlsMachineEvent =
  | InitEvent
  | UpdateEvent
  | StartAnimateEvent
  | AnimateEvent
  | PanMoveEvent
  | PanEndEvent;

const pointerMove$ = fromEvent<PointerEvent>(window, 'pointermove');

const pointerUp$ = fromEvent<PointerEvent>(window, 'pointerup');

const createMove$ = (domElement: HTMLElement): Observable<PanMoveEvent> =>
  fromEvent<PointerEvent>(domElement, 'pointerdown').pipe(
    mergeMap(() => pointerMove$.pipe(takeUntil(pointerUp$))),
    map((event) => ({ type: 'PAN_MOVE', data: event }))
  );

const stopMoving$: Observable<PanEndEvent> = pointerUp$.pipe(
  map(() => ({ type: 'PAN_END' }))
);

/** @xstate-layout N4IgpgJg5mDOIC5QCcD2AXAhusBhVAdumgDawB0ADpgQQJYFQDEAkgHIsAqA2gAwC6iUJVSw66OoSEgAHogDsAJgA0IAJ6IArAE5N5AGwBmRfIAsp7af0AOXosMBfB6rRYc+IqQrVaDZgAUAQTYAfQBZAHkANQBRPkEkEBExCSlEuQQlVQ0EU15tcnNFfVNDbUUTAEYKpxcMbDxCYlQyKhp6RnJMAGMJADcwJiDQmLYAEXjpZPFJAmkM+XzyTX1FC31tSv15a0VNbMRS+XJDHUNeeWNK6ytNWpBXBo9m1p8OqC7eugGh4PDouICKaiGZpUAZMqGciKazVPLacrybQHBBrY6mTTnGybfQ6ezye6PdxNLxtXydHr9QYAVX8Y0CnEBCWEINSc3Sh14pnIsJKvGqmk0vCF+n0KMqQvICIR8jMimq1kxpiczhABFQEDg0iJjU8LXgiWmbPmiAAtGsUeaodKbbbtNZCfViXrXu0-MCUrMTajTCijIVpdZrPJKrwSsV5HdVTrnqS3n5yHQICQwB7QezwYgbpUDPlDCVtpoQ5GUeY9KHtOchVZNppldGnbqXt43RSvgM08aOajKscVmtg0jI7xISjDJGeWdQ4oEbiR-oVQ4gA */
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
      lastRotationRef: new Euler(),

      domElement: document.createElement('div'),

      EPS: 0.000001,
      panSpeed: 0.01,
    },
    tsTypes: {} as import('./rotateControls.machine.typegen').Typegen0,
    type: 'parallel',
    states: {
      panning: {
        initial: 'idle',
        states: {
          idle: {},

          active: {
            entry: 'panStart',
            exit: 'panEnd',
            description:
              'The panning.active state represents the user actively interacting with the panning controls',
            on: {
              PAN_END: {
                target: 'idle',
              },
              PAN_MOVE: {
                actions: ['pan', 'update'],
              },
              UPDATE: {
                actions: 'update',
              },
            },
          },
        },
        on: {
          INIT: {
            actions: 'init',
            target: '.idle',
          },
          PAN_MOVE: {
            target: '.active',
          },
        },
      },
    },
  },
  {
    actions: {
      init: assign(({ moveRef$, stopMovingRef$ }, { object, domElement }) => {
        if (moveRef$ && moveRef$.stop) {
          moveRef$.stop();
        }
        if (stopMovingRef$ && stopMovingRef$.stop) {
          stopMovingRef$.stop();
        }

        return {
          translateRef: object.rotation.clone(),
          object,
          domElement,
          moveRef$: spawn(createMove$(domElement)),
          stopMovingRef$: spawn(stopMoving$),
        };
      }),
      update: ({ panDeltaRef, rotationRef, lastRotationRef, object, EPS }) => {
        rotationRef.y += panDeltaRef.x;
        // rotationRef.x += panOffsetRef.y;

        panDeltaRef.set(0, 0);

        if (object) {
          object.rotation.copy(rotationRef);
        }
        if (lastRotationRef.y - rotationRef.y > EPS) {
          lastRotationRef.copy(rotationRef);
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
  }
);
