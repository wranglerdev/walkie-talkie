function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function maxEdits(len: number): number {
  if (len <= 3) return 0
  if (len <= 6) return 1
  return 2
}

// Checks if `name` appears in `text` with fuzzy tolerance.
export function fuzzyIncludes(name: string, text: string): boolean {
  const normName = normalize(name)
  const normText = normalize(text)

  if (normText.includes(normName)) return true

  const nameWords = normName.split(/\s+/)
  const textWords = normText.split(/\s+/)
  const windowSize = nameWords.length

  if (windowSize > textWords.length) return false

  const threshold = maxEdits(normName.replace(/\s+/g, "").length)
  if (threshold === 0) return false

  const nameStr = nameWords.join(" ")
  for (let i = 0; i <= textWords.length - windowSize; i++) {
    const window = textWords.slice(i, i + windowSize).join(" ")
    if (levenshtein(nameStr, window) <= threshold) return true
  }

  return false
}

// Checks if two names are approximately equal.
export function fuzzyEqual(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  const threshold = maxEdits(Math.min(na.length, nb.length))
  if (threshold === 0) return false
  return levenshtein(na, nb) <= threshold
}
