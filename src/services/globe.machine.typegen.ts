
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.pathSpawner": { type: "done.invoke.pathSpawner"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.pathSpawner": { type: "error.platform.pathSpawner"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "fetchMap$": "done.invoke.globe.loading:invocation[0]";
"pathSpawner": "done.invoke.pathSpawner";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "plotGlobeDots": "SET_MAP_DATA" | "UPDATE_GLOBE_DOTS";
"setMapData": "SET_MAP_DATA";
"updateGlobeDots": "UPDATE_GLOBE_DOTS";
"updateMaxPaths": "UPDATE_MAX_PATHS";
"updatePaths": "UPDATE_PATHS";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "fetchMap$": "UPDATE_GLOBE_DOTS" | "xstate.init";
"pathSpawner": "SET_MAP_DATA" | "UPDATE_GLOBE_DOTS" | "UPDATE_MAX_PATHS" | "UPDATE_PATHS";
        };
        matchesStates: "active" | "loading";
        tags: never;
      }
  