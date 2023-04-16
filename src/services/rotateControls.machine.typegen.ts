
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
"xstate.stop": { type: "xstate.stop" };
        };
        invokeSrcNameMap: {
          
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "init": "INIT";
"pan": "PAN_MOVE";
"panEnd": "INIT" | "PAN_END" | "xstate.stop";
"panStart": "PAN_MOVE";
"update": "PAN_MOVE" | "UPDATE";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          
        };
        matchesStates: "panning" | "panning.active" | "panning.idle" | { "panning"?: "active" | "idle"; };
        tags: never;
      }
  