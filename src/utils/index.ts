const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const compareObj = (a: object, b: object): boolean => {
  return JSON.stringify(a) === JSON.stringify(b)
}

export {generateUniqueId,compareObj}