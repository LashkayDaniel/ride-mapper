const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const compareObj = (a: object, b: object): boolean => {
  return JSON.stringify(a) === JSON.stringify(b)
}

const parseDate = (time: number): string => {
  return new Date(time).toLocaleDateString()
}

export { generateUniqueId, compareObj, parseDate }