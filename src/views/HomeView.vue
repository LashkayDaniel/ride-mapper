<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import VButton from '@/components/VButton.vue'
import VSplitter from '@/components/VSplitter.vue'
import { useAddress } from '@/composables/useAddress'
import VTextInput from '@/components/VTextInput.vue'
import SlideFadeAnimation from '@/components/animations/SlideFadeAnimation.vue'
import { useRouteStore } from '@/stores/route'
import type { CoordInfo } from '@/types/CoordInfo'
import type { Route } from '@/types/Route'
import GroupListAnimation from '@/components/animations/GroupListAnimation.vue'
import { storeToRefs } from 'pinia'
import IconDistance from '@/components/icons/IconDistance.vue'
import IconDuration from '@/components/icons/IconDuration.vue'
import { parseDate } from '@/utils'


const { getCityFromCoords } = useAddress()

const routeStore = useRouteStore()
const { routeList, addRoute, deleteRoute, toggleLike } = routeStore
const { likedRoutesCount } = storeToRefs(routeStore)

const mapContainer = ref(null)
const map = ref<object | null>(null)
const directionsService = ref(null)
const directionsRenderer = ref(null)
const directions = ref({ steps: [] })

const startCoord = ref<string>('')
const endCoord = ref<string>('')
const isSelectingStart = ref(true)
let startMarker: any, endMarker: any
let currentRoute = { route: null, startMarker: null, endMarker: null }

const canShowNav = ref(false)
const activeFilter = ref<string>('all')
const startAddressName = ref<string>('')
const endAddressName = ref<string>('')


onMounted(() => {
  initMap()
})


const isRouteCoordFilled = computed<boolean>(() => {
  return !!startCoord.value && !!endCoord.value
})

const filteredRouteList = computed<Route[]>(() => {
  const filter: { [key: string]: () => Route[] } = {
    all: () => routeList,
    liked: () => routeList.filter(el => el.isLiked)
  }
  const filterElement = filter[activeFilter.value]
  if (filterElement()) {
    return filterElement()
  }
  return routeList
})

const calcDistance = computed(() => {
  const totalMeters = directions.value.steps.length === 0 ? 0 : directions.value.steps.reduce((acc, item) => {
    return acc + item?.distance?.value
  }, 0)

  return Math.ceil(totalMeters / 1000)
})

const calcDuration = computed(() => {
  const totalSeconds = directions.value.steps.length === 0 ? 0 : directions.value.steps.reduce((acc, item) => {
    return acc + item?.duration?.value
  }, 0)

  const minutes = Math.ceil(totalSeconds / 60)
  if (minutes < 60) {
    return `${minutes} хв.`
  }
  return `${Math.round((minutes / 60) * 10) / 10} год.`
})

const getStartPos = computed(() => {
  const [startLat, startLng] = startCoord.value.split(', ')
  return { lat: parseFloat(startLat), lng: parseFloat(startLng) }
})

const getEndPos = computed(() => {
  const [endLat, endLng] = endCoord.value.split(', ')
  return { lat: parseFloat(endLat), lng: parseFloat(endLng) }
})




watch(() => startCoord.value, () => {
  startMarker = setMarker(getStartPos.value, 'A')
})

watch(() => endCoord.value, () => {
  endMarker = setMarker(getEndPos.value, 'B')
})

watch(() => startCoord.value && endCoord.value, async () => {
  if (isRouteCoordFilled.value) {
    deleteMarker(startMarker)
    deleteMarker(endMarker)
    clearPreviousRouteMarkers()
    calculateAndDisplayRoute(getStartPos.value, getEndPos.value, true, true)

    const { lat: startLat, lng: startLng } = getStartPos.value
    startAddressName.value = await fetchAddress(startLat, startLng)

    const { lat: endLat, lng: endLng } = getEndPos.value
    endAddressName.value = await fetchAddress(endLat, endLng)
  }
})


async function fetchAddress(latitude: number, longitude: number): Promise<string> {
  let address: string = ''
  try {
    address = await getCityFromCoords(latitude, longitude)
  } catch (error) {
    console.error(error)
    alert(error)
  }
  return address
}

function setMarker(position: object, label: string = '') {
  return new google.maps.Marker({ position: position, map: map.value, label: label })
}

function deleteMarker(marker: object) {
  if (marker) {
    marker.setMap(null)
  }
}

function clearStartEndCoord() {
  startCoord.value = endCoord.value = ''
  deleteMarker(startMarker)
  deleteMarker(endMarker)
  if (currentRoute.route) {
    currentRoute.route.setMap(null)
    currentRoute.route = null
  }
  deleteMarker(currentRoute.startMarker || {})
  deleteMarker(currentRoute.endMarker || {})
  canShowNav.value = false
}

function onFocusStartCoord() {
  isSelectingStart.value = true
  selectCoordinate()
}

function onFocusEndCoord() {
  isSelectingStart.value = false
  selectCoordinate()
}

function clearPreviousRouteMarkers() {
  if (currentRoute.startMarker) {
    deleteMarker(currentRoute.startMarker)
  }
  if (currentRoute.endMarker) {
    deleteMarker(currentRoute.endMarker)
  }
}

function showRoute(route: Route) {
  clearPreviousRouteMarkers()
  const { start, end } = route
  calculateAndDisplayRoute(start, end)
  startAddressName.value = start.address
  endAddressName.value = end.address
  startCoord.value = `${start.lat}, ${start.lng}`
  endCoord.value = `${end.lat}, ${end.lng}`
  canShowNav.value = true
}

function selectCoordinate() {
  map.value.addListener('click', (event: any) => {
    const { latLng } = event
    const lat = latLng.lat().toFixed(6)
    const lng = latLng.lng().toFixed(6)

    if (isSelectingStart.value) {
      if (!startCoord.value) {
        startCoord.value = `${lat}, ${lng}`
      }
    } else {
      if (!endCoord.value) {
        endCoord.value = `${lat}, ${lng}`
      }
    }
  })
}

function initMap() {
  map.value = new google.maps.Map(mapContainer.value, {
    center: { lat: 48.3794, lng: 31.1656 },
    zoom: 6
  })

  directionsService.value = new google.maps.DirectionsService()
  directionsRenderer.value = new google.maps.DirectionsRenderer()
  directionsRenderer.value.setMap(map.value)
}


function calculateAndDisplayRoute(startPos: object, endPos: object, showStartMarker = false, showEndMarker = true): void {
  directionsRenderer.value.setOptions({
    suppressMarkers: true,
    map: map.value
  })

  currentRoute.route = directionsRenderer.value

  if (showStartMarker) {
    currentRoute.startMarker = new google.maps.Marker({
      position: startPos,
      map: map.value,
      title: 'Start Point',
      icon: {
        url: '/location.png',
        scaledSize: new google.maps.Size(34, 34)
      }
    })
  }

  if (showEndMarker) {
    currentRoute.endMarker = new google.maps.Marker({
      position: endPos,
      map: map.value,
      title: 'End Point',
      icon: {
        url: '/destination.png',
        scaledSize: new google.maps.Size(34, 34)
      }
    })
  }

  directionsService.value.route(
    {
      origin: startPos,
      destination: endPos,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (response: any, status: any) => {
      if (status === 'OK') {
        directionsRenderer.value.setDirections(response)
        directions.value.steps = response.routes[0].legs[0].steps
      } else {
        console.error('Could not display route due to: ' + status)
      }
    }
  )
}

function startTrip() {
  const start: CoordInfo = { ...getStartPos.value, address: startAddressName.value }
  const end: CoordInfo = { ...getEndPos.value, address: endAddressName.value }
  const newRoute: Route = {
    start,
    end,
    distance: calcDistance.value,
    duration: calcDuration.value,
    created: new Date().getTime(),
    isLiked: false
  }
  addRoute(newRoute)
  canShowNav.value = true
}
</script>

<template>
  <main class="w-full h-full flex">
    <section class="flex-1">
      <div ref="mapContainer" class="w-full h-full"></div>
    </section>
    <section class="w-1/3 bg-gray-100 p-4 border-l flex flex-col overflow-auto">
      <form class="px-16">
        <VTextInput class="w-full"
                    v-model="startCoord"
                    placeholder="Select a starting point on the map"
                    @focus="onFocusStartCoord"
                    readonly
        />
        <VTextInput class="w-full my-2"
                    v-model="endCoord"
                    placeholder="Select an endpoint on the map"
                    @focus="onFocusEndCoord"
                    readonly
        />
        <VButton v-if="isRouteCoordFilled"
                 class="text-sm flex items-center space-x-1"
                 type="button"
                 @click="clearStartEndCoord">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="size-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          <span>clear all</span>
        </VButton>
      </form>

      <div class="overflow-y-auto my-4">
        <SlideFadeAnimation>
          <section v-if="isRouteCoordFilled"
                   class="text-gray-600 w-full flex flex-col border border-gray-400 bg-gray-300/50 rounded-xl p-4 my-4">
            <p>from: <b>{{ startAddressName }}</b></p>
            <p>to: <b>{{ endAddressName }}</b></p>
            <div class="flex justify-between mt-2">
              <p class="flex items-center gap-x-2 p-2 bg-gray-400/40 rounded-xl border border-gray-400 px-4">
                <IconDistance :size="5" />
                distance: <b>{{ calcDistance }}
                km</b>
              </p>
              <p class="flex items-center gap-x-2 p-2 bg-gray-400/40 rounded-xl border border-gray-400 px-4">
                <IconDuration :size="5" />
                duration: <b>{{ calcDuration }}</b>
              </p>
            </div>
            <button v-show="!canShowNav"
                    @click="startTrip"
                    class="group bg-black/90 text-gray-300 w-fit px-4 py-2 rounded-full flex items-center space-x-2 tracking-wider font-medium mt-4">
              <span>Start trip</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                   stroke="currentColor"
                   class="size-4 group-hover:ml-3 duration-200 transition-all group-hover:scale-x-110">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </section>
        </SlideFadeAnimation>

        <template v-if="canShowNav">
          <VSplitter>Navigation</VSplitter>
          <ul class="bg-gray-200 border border-gray-400 p-2 rounded-lg">
            <li v-for="(step, index) in directions.steps"
                :key="index"
                v-html="step.instructions"
                class="text-gray-600 bg-gray-100/90 my-2 p-2 rounded-xl"
            ></li>
          </ul>
        </template>

        <VSplitter>Recent History</VSplitter>
        <div class="flex items-center gap-x-2">
          <div>
            <input type="radio"
                   id="all"
                   value="all"
                   v-model="activeFilter"
                   class="hidden peer">
            <label for="all"
                   class="rounded-full text-sm font-medium text-black bg-gray-300 p-1 px-4 hover:bg-black/70 hover:text-white transition-all duration-200 cursor-pointer peer-checked:bg-black peer-checked:text-white peer-checked:border-0"
            >All</label>
          </div>
          <div>
            <input type="radio"
                   id="liked"
                   value="liked"
                   v-model="activeFilter"
                   class="hidden peer">
            <label for="liked"
                   class="rounded-full text-sm font-medium text-black bg-gray-300 p-1 px-4 hover:bg-black/70 hover:text-white transition-all duration-200 cursor-pointer peer-checked:bg-black peer-checked:text-white peer-checked:border-0"
            >Liked ({{ likedRoutesCount }})</label>
          </div>
        </div>
        <GroupListAnimation class="flex flex-col space-y-2 overflow-y-auto mt-2" name="list" tag="ul">
          <li v-if="filteredRouteList.length===0"
              class="text-sm text-center text-gray-400">No routes
          </li>
          <li v-else
              v-for="(route,idx) in filteredRouteList"
              :key="idx"
              class="flex justify-between items-center bg-gray-200/50 p-4 rounded-lg border border-gray-300">
            <div class="flex flex-col text-gray-600">
              <h2 class="font-bold mb-1">{{ route?.start?.address.split(',')[0] }} -
                {{ route?.end?.address.split(',')[0] }}</h2>
              <ul class="flex items-center space-x-2">
                <li class="flex items-center space-x-1 text-sm">
                  <IconDistance />
                  <span>{{ route?.distance }} km</span>
                </li>
                <li><span class="block size-1 bg-gray-500 rounded-full"></span></li>
                <li class="flex items-center space-x-1 text-sm">
                  <IconDuration />
                  <span>{{ route?.duration }}</span>
                </li>
              </ul>
              <time class="text-gray-500 bg-gray-200 w-fit px-2 rounded-full mt-2"><small>{{ parseDate(route.created)
                }}</small></time>
            </div>
            <div class="flex items-center space-x-2">
              <VButton class="text-sm"
                       @click="showRoute(route)">show
              </VButton>
              <button @click="toggleLike(route.id ?? '')" title="Like">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                     stroke="currentColor" class="size-5"
                     :class="route.isLiked ? ['fill-red-400','stroke-red-600']:''">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </button>
              <button @click="deleteRoute(route.id ?? '')" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                     stroke="currentColor" class="size-5 hover:fill-red-500 transition-colors duration-200">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </li>
        </GroupListAnimation>
      </div>
    </section>
  </main>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>