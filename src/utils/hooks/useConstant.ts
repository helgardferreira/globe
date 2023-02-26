/**
 * Courtesy of [Andarist](https://github.com/Andarist)
 * https://github.com/Andarist/use-constant/blob/main/src/index.ts
 */
import * as React from 'react';

type ResultBox<T> = { v: T };

export const useConstant = <T>(fn: () => T): T => {
  const ref = React.useRef<ResultBox<T>>();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
};
