export function useAddress() {
  const geocoder = new google.maps.Geocoder()

  function getCityFromCoords(lat: number, lng: number): Promise<string> {
    const latlng: google.maps.LatLngLiteral = { lat, lng }

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {

          const components: google.maps.GeocoderAddressComponent[] = results[0].address_components

          const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name
          const city = components.find(c => c.types.includes('locality'))?.long_name
          const streetName = components.find(c => c.types.includes('route'))?.long_name
          const region = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name
          const country = components.find(c => c.types.includes('country'))?.short_name

          if (!streetName && !streetNumber) {
            resolve([city, region, country].filter(Boolean).join(', '))
          }

          resolve([streetName, streetNumber, city, region].filter(Boolean).join(', '))
        } else {
          reject('Geocoder failed due to: ' + status)
        }
      })
    })
  }

  return { getCityFromCoords }
}