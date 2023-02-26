import React, { useEffect } from 'react';
import { useInterpret, useSelector } from '@xstate/react';

import { pathMachine } from '../services/path.machine';

type PathProps = {
  globeRadius: number;
};

export const Path: React.FC<PathProps> = React.memo(function Path(props) {
  const { globeRadius } = props;
  const pathService = useInterpret(pathMachine);
  const pathLine = useSelector(pathService, (state) => state.context.pathLine);

  useEffect(() => {
    // const startLocation = {
    //   country: 'United States',
    //   region: 'Texas',
    //   city: 'Dallas',
    //   lat: 32.7936,
    //   long: -96.7662,
    //   population: 5743938,
    // };
    const startLocation = {
      country: 'South Africa',
      region: 'Gauteng',
      city: 'Johannesburg',
      lat: -26.2044,
      long: 28.0416,
      population: 4434827,
    };
    const endLocation = {
      country: 'United States',
      region: 'New York',
      city: 'New York',
      lat: 40.6943,
      long: -73.9249,
      population: 18713220,
    };

    if (startLocation && endLocation && globeRadius) {
      pathService.send({
        type: 'INIT',
        startLocation,
        endLocation,
        globeRadius,
      });
    }
  }, [globeRadius, pathService]);

  return <group>{pathLine && <primitive object={pathLine} />}</group>;
});
