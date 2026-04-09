import type { ValueSource } from '../types';

// ─── Entity Cache Interface ────────────────────────────────────────────────────

export interface EntityCache {
  /** Returns a resolved numeric value, or undefined if not in cache */
  get(id: string): number | undefined;
  /** Returns the raw string state, or undefined if not in cache */
  getString(id: string): string | undefined;
}

// ─── Null cache (safe default when no cache is provided) ─────────────────────

const nullCache: EntityCache = {
  get:       () => undefined,
  getString: () => undefined,
};

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolves a ValueSource to a concrete number using the provided entity cache.
 *
 * Resolution rules by origin:
 *   entity  → look up entityId in the cache
 *   static  → if haHelperEntityId is set, look that up (falls back to staticValue)
 *             otherwise return staticValue directly
 *   event   → if triggerEntityId is set, map its string state through triggerValueMap
 *             otherwise return overrideValue (manual override / type 6)
 */
export function resolveValue(src: ValueSource | undefined, cache: EntityCache = nullCache): number {
  if (!src) return 0;
  switch (src.origin) {
    case 'entity':
      return cache.get(src.entityId ?? '') ?? 0;

    case 'static':
      if (src.haHelperEntityId) {
        return cache.get(src.haHelperEntityId) ?? src.staticValue ?? 0;
      }
      return src.staticValue ?? 0;

    case 'event':
      if (src.triggerEntityId) {
        const state = cache.getString(src.triggerEntityId) ?? 'off';
        return src.triggerValueMap?.[state] ?? 0;
      }
      return src.overrideValue ?? 0;
  }
}

/** Returns the display unit string from a ValueSource */
export function resolveUnit(src: ValueSource | undefined): string {
  return src?.unit ?? '';
}
