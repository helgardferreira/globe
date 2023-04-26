
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "loadData$": "done.invoke.pathSpawner.loading:invocation[0]";
"spawnPaths$": "done.invoke.pathSpawner.active.live:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "disposePath": "DISPOSE_PATH";
"forwardToChildren": "PAUSE" | "PLAY";
"setData": "SET_DATA";
"spawnPath": "SPAWN_PATH";
"updateGlobe": "DISPOSE_PATH" | "SPAWN_PATH";
"updateMaxPaths": "UPDATE_MAX_PATHS";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "loadData$": "xstate.init";
"spawnPaths$": "DISPOSE_PATH" | "PLAY" | "SET_DATA" | "SPAWN_PATH" | "UPDATE_MAX_PATHS";
        };
        matchesStates: "active" | "active.live" | "loading" | "paused" | { "active"?: "live"; };
        tags: never;
      }
  