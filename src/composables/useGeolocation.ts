import type { Ref } from 'vue'
import { ref } from 'vue'

export function useGeolocation() {
  const enableHighAccuracy = true,
    maximumAge = 30000,
    timeout = 27000

  const locatedAt: Ref<number | null> = ref(null)

  const error = ref<GeolocationPositionError | null>(null)

  const coords: Ref<GeolocationPosition['coords']> = ref({
    accuracy: 0,
    latitude: Infinity,
    longitude: Infinity,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null
  })
  let watcher: number

  function updatePosition(position: GeolocationPosition) {
    locatedAt.value = position.timestamp
    coords.value = position.coords
    error.value = null
  }

  function initWatch() {
    if (!navigator.geolocation) {
      error.value = {
        message: 'geolocation api not available'
      } as GeolocationPositionError
    } else {
      watcher = navigator.geolocation.watchPosition(updatePosition, (err) => (error.value = err), {
        enableHighAccuracy,
        maximumAge,
        timeout
      })
    }
  }

  function stopWatch() {
    navigator.geolocation.clearWatch(watcher)
  }

  return { initWatch, coords, locatedAt, error, stopWatch }
}