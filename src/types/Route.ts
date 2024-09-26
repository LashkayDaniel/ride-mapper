import type { CoordInfo } from '@/types/CoordInfo'

export type Route = {
  id?: string,
  start: CoordInfo,
  end: CoordInfo,
  distance: number,
  duration: string,
  created: number,
  isLiked: boolean
}