export const sleep = (ms: number): Promise<void> => {
  if (ms <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => setTimeout(resolve, ms))
}

const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0

  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randomNormalDelay = (
  meanMs: number,
  stddevMs: number,
  minMs: number,
  maxMs: number,
  seed: number,
): (() => number) => {
  const rand = seed === 0 ? Math.random : mulberry32(seed)

  return () => {
    const u1 = Math.max(rand(), Number.MIN_VALUE)
    const u2 = rand()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const value = meanMs + z * stddevMs

    return Math.min(Math.max(value, minMs), maxMs)
  }
}
