export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 200) {
  let t: any
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}
