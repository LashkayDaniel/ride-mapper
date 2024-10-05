import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import type { Route } from '@/types/Route'
import { compareObj, generateUniqueId } from '@/utils'

export const useRouteStore = defineStore('route', () => {


  const localStorageData = localStorage.getItem('routes')
  const routeList = reactive<Route[]>(localStorageData ? JSON.parse(localStorageData) : [])

  const sortRoutesByCreatedDesc = () => {
    routeList.sort((a: Route, b: Route) => b.created - a.created)
  }


  //getters
  const likedRoutesCount = computed<number>(() => {
    return routeList.reduce((acc: number, r: Route) => acc + (r.isLiked ? 1 : 0), 0)//filter((r: Route) => r.isLiked).length
  })


  const updateRouteList = () => {
    localStorage.setItem('routes', JSON.stringify(routeList))
  }


  //   actions
  const addRoute = (route: Route) => {
    const checkDuplicate: Route | undefined = routeList.find((i: Route) => compareObj(i.start, route.start) && compareObj(i.end, route.end))
    if (checkDuplicate !== undefined) {
      alert('Such a route already exists')
      return
    }
    routeList.push({ id: generateUniqueId(), ...route, isLiked: false })
    sortRoutesByCreatedDesc()
    updateRouteList()
    return route
  }

  const deleteRoute = (id: string) => {
    const foundedIndex: number = routeList.findIndex((item: Route) => item.id === id)
    if (foundedIndex === -1) {
      console.log('Route not found')
      return
    }
    if (confirm('Do you confirm the deletion of the route?')) {
      routeList.splice(foundedIndex, 1)
      updateRouteList()
    }
  }

  const toggleLike = (id: string) => {
    const foundedRoute: Route | undefined = routeList.find((item: Route) => item.id === id)
    if (foundedRoute) {
      foundedRoute.isLiked = !foundedRoute.isLiked
      updateRouteList()
    }
  }

  return { routeList, addRoute, deleteRoute, toggleLike, likedRoutesCount }
})