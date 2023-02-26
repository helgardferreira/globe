import React, {
  type PropsWithChildren,
  createContext,
  useContext,
} from 'react';

import { globeService, pathSpawnerService } from './services';

type Services = {
  globeService: typeof globeService;
  pathSpawnerService: typeof pathSpawnerService;
};

const GlobalServiceContext = createContext<Services | undefined>(undefined);

export const useServices = () => {
  const globalServiceContext = useContext(GlobalServiceContext);
  if (!globalServiceContext) {
    throw new Error(
      'No GlobalServiceContext.Provider found when calling useServices.'
    );
  }
  return globalServiceContext;
};

export const GlobalServiceProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <GlobalServiceContext.Provider
      value={{
        globeService,
        pathSpawnerService,
      }}
    >
      {children}
    </GlobalServiceContext.Provider>
  );
};
