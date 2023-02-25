import React, {
  type PropsWithChildren,
  createContext,
  useContext,
} from 'react';

import { globeBuilderService } from './services';

type Services = {
  globeBuilderService: typeof globeBuilderService;
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
        globeBuilderService,
      }}
    >
      {children}
    </GlobalServiceContext.Provider>
  );
};
