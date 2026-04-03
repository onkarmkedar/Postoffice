import { lazy, Suspense } from 'react';

const MapView = lazy(() => import('./map/MapView'));

export default function PostOfficeMap(props) {
  return (
    <Suspense fallback={<p>Loading map...</p>}>
      <MapView {...props} />
    </Suspense>
  );
}
