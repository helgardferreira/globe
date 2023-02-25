import { Subject } from 'rxjs';

export const fromImageLoad = (url: string) => {
  const imageLoad$ = new Subject<HTMLImageElement>();

  // Create a new Image instance
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.style.display = 'none';

  img.onload = () => {
    imageLoad$.next(img);
    imageLoad$.complete();
  };
  img.onerror = (e) => {
    imageLoad$.error(e);
  };

  return imageLoad$.asObservable();
};
