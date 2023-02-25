
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "fetchMap$": "done.invoke.globeBuilder.loading:invocation[0]";
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
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "fetchMap$": "xstate.init";
        };
        matchesStates: "active" | "loading";
        tags: never;
      }
  