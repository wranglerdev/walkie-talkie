import { describe, expect, it } from "vitest"
import { fuzzyEqual, fuzzyIncludes } from "../utils/fuzzy"

describe("fuzzyIncludes", () => {
  it("matches exact substring (fast path)", () => {
    expect(fuzzyIncludes("Gusmão", "falar com Gusmão sobre isso")).toBe(true)
  })

  it("matches with single char substitution (Gusmão → Guzmão)", () => {
    expect(fuzzyIncludes("Gusmão", "falar com Guzmão sobre isso")).toBe(true)
  })

  it("matches with diacritic normalization (Gusmão registered, Gusmao in transcript)", () => {
    expect(fuzzyIncludes("Gusmão", "falar com Gusmao sobre isso")).toBe(true)
  })

  it("matches João even when transcript says Joao", () => {
    expect(fuzzyIncludes("João", "reunião com Joao amanhã")).toBe(true)
  })

  it("matches case-insensitively", () => {
    expect(fuzzyIncludes("Maria", "ligar para MARIA hoje")).toBe(true)
  })

  it("does not match a completely different short name (≤3 chars require exact)", () => {
    expect(fuzzyIncludes("Ana", "falar com Ina sobre o projeto")).toBe(false)
  })

  it("does not fuzzy-match a short name (≤3 chars) even with 1 edit", () => {
    expect(fuzzyIncludes("Ana", "falar com Ama sobre isso")).toBe(false)
  })

  it("matches multi-word name in a long transcript", () => {
    expect(
      fuzzyIncludes("Carlos Eduardo", "reunião com Carlos Eduardo amanhã de manhã"),
    ).toBe(true)
  })

  it("matches multi-word name with 1 char substitution in one word", () => {
    expect(
      fuzzyIncludes("Carlos Eduardo", "reunião com Carlos Edvardo amanhã"),
    ).toBe(true)
  })

  it("does not match an unrelated name", () => {
    expect(fuzzyIncludes("Gusmão", "reunião com Paulo sobre o projeto")).toBe(false)
  })

  it("does not match when name is too different from any window", () => {
    expect(fuzzyIncludes("Roberto", "falar com Ana sobre isso")).toBe(false)
  })
})

describe("fuzzyEqual", () => {
  it("matches exact strings", () => {
    expect(fuzzyEqual("Alpha", "Alpha")).toBe(true)
  })

  it("matches with case difference", () => {
    expect(fuzzyEqual("Alpha", "alpha")).toBe(true)
  })

  it("matches with diacritic difference", () => {
    expect(fuzzyEqual("Integração", "Integracao")).toBe(true)
  })

  it("matches with single char substitution (Apha → Alpha)", () => {
    expect(fuzzyEqual("Alpha", "Apha")).toBe(true)
  })

  it("does not match completely different strings", () => {
    expect(fuzzyEqual("Alpha", "Beta")).toBe(false)
  })

  it("does not fuzzy-match short strings (≤3 chars) with any edit", () => {
    expect(fuzzyEqual("Go", "No")).toBe(false)
  })
})
