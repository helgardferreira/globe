
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.path.building:invocation[0]": { type: "done.invoke.path.building:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "animateBuild$": "done.invoke.path.building:invocation[0]";
"animateDestroy$": "done.invoke.path.destroying:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "init": "INIT";
"updateBuild": "UPDATE_BUILD";
"updateDestroy": "UPDATE_DESTROY";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "animateBuild$": "INIT" | "UPDATE_BUILD";
"animateDestroy$": "UPDATE_DESTROY" | "done.invoke.path.building:invocation[0]";
        };
        matchesStates: "building" | "destroying" | "dispose" | "idle";
        tags: never;
      }
  