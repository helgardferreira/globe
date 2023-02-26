export const normalize = (
  value: number,
  min: number,
  max: number,
  a: number,
  b: number
) => {
  // Will always give a value between 0 and 1
  const normalizedValue = (value - min) / (max - min) || 0;
  return (b - a) * normalizedValue + a;
};
