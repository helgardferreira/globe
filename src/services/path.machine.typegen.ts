
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.path.building:invocation[0]": { type: "done.invoke.path.building:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.path.destroying:invocation[0]": { type: "done.invoke.path.destroying:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
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
          "dispose": "done.invoke.path.destroying:invocation[0]";
"init": "UPDATE_BUILD" | "xstate.init";
"updateBuild": "UPDATE_BUILD";
"updateDestroy": "UPDATE_DESTROY";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "animateBuild$": "UPDATE_BUILD" | "xstate.init";
"animateDestroy$": "UPDATE_DESTROY" | "done.invoke.path.building:invocation[0]";
        };
        matchesStates: "building" | "destroying" | "dispose";
        tags: never;
      }
  