
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "panEnd$": "done.invoke.rotateControls.active:invocation[2]";
"panMove$": "done.invoke.rotateControls.active:invocation[0]";
"panStart$": "done.invoke.rotateControls.active:invocation[1]";
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
"panEnd": "PAN_END";
"panStart": "PAN_START";
"update": "PAN_MOVE" | "UPDATE";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "panEnd$": "INIT" | "PAN_END" | "PAN_START";
"panMove$": "INIT" | "PAN_END" | "PAN_START";
"panStart$": "INIT" | "PAN_END" | "PAN_START";
        };
        matchesStates: "active" | "idle";
        tags: never;
      }
  