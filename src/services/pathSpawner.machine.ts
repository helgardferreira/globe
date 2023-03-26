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
  value: number;
};

export type PathSpawnerEvent =
  | SetDataEvent
  | SpawnPathEvent
  | { type: 'DISPOSE_PATH'; pathId: string }
  | UpdateMaxPathsEvent;

type PathSpawnerContext = {
  locations?: PathLocation[];
  pathData?: {
    id: string;
    startLocation: PathLocation;
    endLocation: PathLocation;
  }[];
  paths: PathWithId[];
};

const paths$ = new BehaviorSubject<PathSpawnerContext['paths']>([]);

let maxPaths = 10;

/** @xstate-layout N4IgpgJg5mDOIC5QAcCGAXAFgZTQdwDswAnAOgBsB7VCASwKgGJsBRAFQH0ARAQTZ4DaABgC6iFJVi10tSgXEgAHogBMAZgBspAJwBGACxCA7LqH7tG7UbMAaEAE9E+g6WsBWI241qhmoSoAOAF8guzQsXFRCElJUAGMZADcwZgAFHgB1ADkOdLYACWExJBBkSWlZeRLlBEMVUhV9FWamgKMVbQC1O0cEH11SNTdtZwDjdrUDNxCwjBx8IjJ4pJSuAElsVIB5Vly+QtEFMqkZOQUatStSXS6NZoD1FS9dHsRdIyMdN0n9DSEzb7qGalOaRaJLBK0ZKMACqqV4bBYHAAsjwABp7ArYIpHcqnKqgC5GfSkIQBYaWIwPDT6NRPV4IAIDNz-f5-TSNNy6EKhEAESgQOBHUELEi4k6Vc6IAC0GgZsuB4XmUUWFGodAY4oqZ2qThUDOcJI0Dx8ahMGg0ujuipFKpiyyhYC1+KlfWJpO0Zva+jqgQNHVcGi832NAT0amCPKAA */
export const pathSpawnerMachine = createMachine(
  {
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
            target: 'active',
            actions: 'setData',
          },
        },
      },

      active: {
        invoke: {
          src: 'spawnPaths$',
        },

        on: {
          SPAWN_PATH: {
            target: 'active',
            internal: true,
            actions: ['spawnPath', 'updateGlobe'],
          },

          DISPOSE_PATH: {
            target: 'active',
            internal: true,
            actions: ['disposePath', 'updateGlobe'],
          },

          UPDATE_MAX_PATHS: {
            target: 'active',
            internal: true,
            actions: 'updateMaxPaths',
          },
        },
      },
    },
  },
  {
    actions: {
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
      spawnPath: assign(({ paths }, { pathId, startLocation, endLocation }) => {
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
      }),
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
      updateMaxPaths: (_, { value }) => {
        maxPaths = value;
      },
      updateGlobe: sendParent(({ paths }) => {
        return {
          type: 'UPDATE_PATHS',
          paths,
        };
      }),
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

export type PathSpawnerActor = ActorRefFrom<typeof pathSpawnerMachine>;
