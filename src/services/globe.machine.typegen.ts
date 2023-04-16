
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
"xstate.stop": { type: "xstate.stop" };
        };
        invokeSrcNameMap: {
          "fetchMap$": "done.invoke.globe.loading:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "disposePathSpawner": "UPDATE_GLOBE_DOTS" | "UPDATE_MAX_PATHS" | "UPDATE_PATHS" | "xstate.stop";
"forwardToPathSpawner": "UPDATE_MAX_PATHS";
"init": "INIT";
"plotGlobeDots": "SET_MAP_DATA" | "UPDATE_GLOBE_DOTS";
"setMapData": "SET_MAP_DATA";
"spawnPathSpawner": "SET_MAP_DATA" | "UPDATE_GLOBE_DOTS" | "UPDATE_MAX_PATHS" | "UPDATE_PATHS";
"updateGlobeDots": "UPDATE_GLOBE_DOTS";
"updateMaxPaths": "UPDATE_MAX_PATHS";
"updatePaths": "UPDATE_PATHS";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "fetchMap$": "INIT";
        };
        matchesStates: "active" | "idle" | "loading";
        tags: never;
      }
  