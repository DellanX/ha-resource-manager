import type { EntityCache } from '../utils/resolveValue';

// ─── Mock entity state ─────────────────────────────────────────────────────────
// Mirrors the values baked into mockData so the UI renders identically.
// When the real HA WebSocket is wired up, these initial values will be replaced
// by live state from subscribe_entities.

const MOCK_NUMERIC: Record<string, number> = {
  // Electric — main panel
  'sensor.solar_inverter_power':  4.2,
  'sensor.grid_import':           2.4,
  'sensor.grid_export':           0,
  'sensor.powerwall_charge':      85,
  // Electric — kitchen
  'sensor.fridge_power':          0.2,
  // Water
  'sensor.water_heater_temp':     40,
  // Pantry — entity-bound inventory items
  'counter.egg_carton':           3,
  'input_number.milk_gallons':    0.5,
  'sensor.rice_weight':           3000,
  'counter.canned_tomatoes':      6,
  // Flows on specific edges
  'sensor.solar_to_battery':      4.2,
};

const MOCK_STRING: Record<string, string> = {
  'switch.kitchen_oven':    'on',
  'switch.main_water_valve': 'on',
  'climate.home_hvac':      'heat',
  'switch.pool_pump':       'off',
};

// ─── HAEntityCache class ───────────────────────────────────────────────────────

class HAEntityCacheImpl implements EntityCache {
  private numeric: Record<string, number> = { ...MOCK_NUMERIC };
  private string:  Record<string, string>  = { ...MOCK_STRING };

  get(id: string): number | undefined {
    return this.numeric[id];
  }

  getString(id: string): string | undefined {
    return this.string[id];
  }

  /** Set a numeric entity value (used by manual overrides) */
  set(id: string, value: number): void {
    this.numeric[id] = value;
  }

  /** Set a string entity state */
  setString(id: string, state: string): void {
    this.string[id] = state;
  }

  /**
   * Stub: subscribe to live state updates for an entity.
   * Returns an unsubscribe function.
   * Will be wired to the HA WebSocket `subscribe_entities` call in the real integration.
   */
  subscribe(_entityId: string, _callback: (value: number) => void): () => void {
    // no-op stub
    return () => {};
  }

  /**
   * Initialise (or reinitialise) from a bulk state snapshot — called on WS connection.
   */
  loadSnapshot(states: Record<string, number>, strings: Record<string, string>): void {
    this.numeric = { ...this.numeric, ...states };
    this.string  = { ...this.string,  ...strings };
  }
}

/** Singleton entity cache — import this wherever you need entity values */
export const haEntityCache = new HAEntityCacheImpl();
