export type MapSize = {
  width: number;
  height: number;
};

export const isDotVisible = (
  lat: number,
  long: number,
  mapSize: MapSize,
  imageData: ImageData
) => {
  const x = Math.trunc(((long + 180) / 360) * mapSize.width);
  const y = Math.trunc(((-lat + 90) / 180) * mapSize.height);
  // Alternative method for calculating y projection
  // const y = mapSize.height - parseInt((lat + 90) / 180 * this.map.height);

  const index = (x + y * mapSize.width) * 4 + 3;
  const alpha = imageData.data[index];
  return alpha > 90;
};
