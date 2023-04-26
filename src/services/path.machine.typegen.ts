
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.path.active.building:invocation[0]": { type: "done.invoke.path.active.building:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.path.active.destroying:invocation[0]": { type: "done.invoke.path.active.destroying:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "animateBuild$": "done.invoke.path.active.building:invocation[0]";
"animateDestroy$": "done.invoke.path.active.destroying:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "dispose": "done.invoke.path.active.destroying:invocation[0]";
"init": "PLAY" | "UPDATE_BUILD" | "xstate.init";
"updateBuild": "UPDATE_BUILD";
"updateDestroy": "UPDATE_DESTROY";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "animateBuild$": "PLAY" | "UPDATE_BUILD" | "xstate.init";
"animateDestroy$": "UPDATE_DESTROY" | "done.invoke.path.active.building:invocation[0]";
        };
        matchesStates: "active" | "active.building" | "active.destroying" | "dispose" | "paused" | { "active"?: "building" | "destroying"; };
        tags: never;
      }
  