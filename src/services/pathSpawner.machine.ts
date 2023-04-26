import { ActorRefFrom, assign, createMachine, sendParent, spawn } from 'xstate';
import {
  type Observable,
  filter,
  from,
  map,
  interval,
  scan,
  BehaviorSubject,
  withLatestFrom,
} from 'rxjs';
import { createPathMachine, PathActorRef, PathLocation } from './path.machine';

type SetDataEvent = {
  type: 'SET_DATA';
  locations: PathLocation[];
};
type SpawnPathEvent = {
  type: 'SPAWN_PATH';
  pathId: string;
  startLocation: PathLocation;
  endLocation: PathLocation;
};

export type PathWithId = {
  id: string;
  pathActorRef: PathActorRef;
};

export type UpdatePathsEvent = {
  type: 'UPDATE_PATHS';
  paths: PathWithId[];
};
export type UpdateMaxPathsEvent = {
  type: 'UPDATE_MAX_PATHS';
  maxPaths: number;
};
type DisposePathEvent = {
  type: 'DISPOSE_PATH';
  pathId: string;
};
type PlayEvent = { type: 'PLAY' };
type PauseEvent = { type: 'PAUSE' };

export type PathSpawnerEvent =
  | SetDataEvent
  | SpawnPathEvent
  | DisposePathEvent
  | UpdateMaxPathsEvent
  | PlayEvent
  | PauseEvent;

type PathSpawnerContext = {
  locations?: PathLocation[];
  pathData?: {
    id: string;
    startLocation: PathLocation;
    endLocation: PathLocation;
  }[];
  paths: PathWithId[];
};

/** @xstate-layout N4IgpgJg5mDOIC5QAcCGAXAFgZTQdwDswAnAOgBsB7VCASwKgGJsBRAFQH0ARAQTZ4DaABgC6iFJVi10tSgXEgAHogBMAZgBspAJwBGACxCA7LqH7tG7UbMAaEAE9E+g6WsBWI241qhmoSoAOAF8guzQsXFRCElJUAGMZADcwZgAFHgB1ADkOdLYACWExJBBkSWlZeRLlBEMVUhV9FWamgKMVbQC1O0cEH11SNTdtZwDjdrUDNxCwjBx8IjJ4pJSuAElsVIB5Vly+QtEFMqkZOQUatStSXS6NZoD1FS9dHsRdIyMdN0n9DSEzb7qGalOaRaJLBK0ZKMACqqV4bBYHAAsjwABp7ArYIpHcqnKqgC5GfSkIQBYaWIwPDT6NRPV4IAIDNz-f5-TSNNy6EKhEAESgQOBHUELEi4k6Vc6IAC0GgZsuB4XmUUWFGodAY4oqZ2qThUDOcJI0Dx8ahMGg0ujuipFKpiyyhYC1+KlfWJpO0Zva+jqgQNHVcGi832NAT0amCPKAA */
export const createPathSpawnerMachine = (maxPaths: number) => {
  const paths$ = new BehaviorSubject<PathSpawnerContext['paths']>([]);

  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5QAcCGAXAFgZTQdwDswAnAOgBsB7VCASwKgGJsBRAFQH0ARAQTZ4DaABgC6iFJVi10tSgXEgAHogBMAZgBspAJwqAjAA4NAdg2GVK7QBYrAGhABPRBoMBWUlbXqXag1Y3axmoAvsH2aFi4qIQkpKgAxjIAbmAUtCnMAAo8AOoAchzZbAASwmJIIMiS0rLyFcoInsakKq7GBkKuHZZq7fZOCG0qpAZqrtqdxhPWLqHhGDj4RGQJyank6WCMXACS2JkA8qyFfKWiClVSMnIKDZ7DKkJqQoEupmYa-YhWrkIelhorO8NK49NprHNKgsojEVolNmkMgBVTK8NgsDgAWR4AA0TiVsGULtVrnVQHcXqQ9EI9K5XCCwYFjMZXF8EGMrB5TK5ehYbKNtJCIotoss4vCUoitpkADI8ACaJyRrCJFUuNRu9Wc4xaKhBKis1IM4L0dkciGMQj+oLaej0GitQgMbiF0KWsTQAFdYJBGLKFUqVec1STardEK4VGyDHpSL8rbSDK0hMYDXpQmEQARKBA4Bc3aKSMSrmGtQgALSfc0VjSuyLushUGj0KDFjVkpTfKPVlzuRPaPQWYw2NR2usi2HitZt0nh9lmKk0ukM8HMllsx7uV5dbSaF7dWuZ4UwsWrBEbFIz0vk76U6m7roaDTPbzGNmWv4Giy9PTD3d68cT1iM9JUwWhYHQShiAGCQS01G9GjvF4xiMZ8hFfDddy5EFR10QEH0AhtSC9H0ICveDOwQPxmntNRtGdEE6X0NQ2TtYYOnBOirFXCYjAzYIgA */
      id: 'pathSpawner',
      initial: 'loading',
      schema: {
        events: {} as PathSpawnerEvent,
        context: {} as PathSpawnerContext,
      },
      tsTypes: {} as import('./pathSpawner.machine.typegen').Typegen0,
      predictableActionArguments: true,

      context: {
        paths: [],
      },

      states: {
        loading: {
          invoke: {
            src: 'loadData$',
          },

          on: {
            SET_DATA: {
              target: 'active.live',
              actions: 'setData',
            },
          },
        },

        active: {
          initial: 'live',

          states: {
            live: {
              invoke: {
                src: 'spawnPaths$',
              },

              on: {
                SPAWN_PATH: {
                  target: 'live',
                  internal: true,
                  actions: ['spawnPath', 'updateGlobe'],
                },

                DISPOSE_PATH: {
                  target: 'live',
                  internal: true,
                  actions: ['disposePath', 'updateGlobe'],
                },

                UPDATE_MAX_PATHS: {
                  target: 'live',
                  internal: true,
                  actions: 'updateMaxPaths',
                },

                PAUSE: {
                  target: '#pathSpawner.paused',
                  actions: 'forwardToChildren',
                },
              },
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
              actions: 'forwardToChildren',
            },
          },
        },
      },
    },
    {
      actions: {
        forwardToChildren: ({ paths }, { type }) => {
          paths.forEach(({ pathActorRef }) => {
            pathActorRef.send(type);
          });
        },
        setData: assign((_, { locations }) => {
          const pathData = [...new Array(200).keys()].map(() => {
            const startIndex = Math.floor(Math.random() * locations.length);
            let endIndex = Math.floor(Math.random() * locations.length);

            while (startIndex === endIndex) {
              endIndex = Math.floor(Math.random() * locations.length);
            }

            const startLocation = locations[startIndex];
            const endLocation = locations[endIndex];

            return {
              startLocation,
              endLocation,
              id: `${startLocation.city}, ${startLocation.country} To ${endLocation.city}, ${endLocation.country}`,
            };
          });

          return {
            locations,
            pathData,
          };
        }),
        spawnPath: assign(
          ({ paths }, { pathId, startLocation, endLocation }) => {
            const pathActorRef: PathActorRef = spawn(
              createPathMachine({
                pathId,
                startLocation,
                endLocation,
              })
            );

            const newPaths = paths.concat({ id: pathId, pathActorRef });

            paths$.next(newPaths);

            return {
              paths: newPaths,
            };
          }
        ),
        disposePath: assign(({ paths }, { pathId }) => {
          const index = paths.findIndex((path) => path.id === pathId);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          paths[index].pathActorRef.stop!();
          const newPaths = paths.slice(0, index).concat(paths.slice(index + 1));

          paths$.next(newPaths);

          return {
            paths: newPaths,
          };
        }),
        updateMaxPaths: (_, { maxPaths: value }) => {
          maxPaths = value;
        },
        updateGlobe: sendParent(({ paths }) => ({
          type: 'UPDATE_PATHS',
          paths,
        })),
      },
      services: {
        loadData$: (): Observable<SetDataEvent> =>
          from(import('../assets/data/curated-countries.json')).pipe(
            map(
              ({ default: locations }) =>
                ({
                  type: 'SET_DATA',
                  locations,
                } as SetDataEvent)
            )
          ),
        spawnPaths$: ({ pathData }): Observable<SpawnPathEvent> => {
          if (!pathData) throw new Error('Missing path data');

          return interval(100).pipe(
            scan((count) => (count + 1) % pathData.length, 0),
            map((count) => pathData[count]),
            withLatestFrom(paths$),
            filter(
              ([path, paths]) =>
                paths.findIndex((p) => p.id === path.id) === -1 &&
                paths.length < maxPaths
            ),
            map(
              ([{ id, startLocation, endLocation }]) =>
                ({
                  type: 'SPAWN_PATH',
                  pathId: id,
                  startLocation,
                  endLocation,
                } as SpawnPathEvent)
            )
          );
        },
      },
    }
  );
};

export type PathSpawnerActor = ActorRefFrom<
  ReturnType<typeof createPathSpawnerMachine>
>;
