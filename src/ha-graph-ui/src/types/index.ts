// ─── Resource Types ────────────────────────────────────────────────────────────

export type ResourceType = 'electric' | 'water' | 'gas' | 'stock';

// ─── Value Source ──────────────────────────────────────────────────────────────

/** Whether the value is instantaneous (rate) or a running total/quantity */
export type ValueKind = 'flow' | 'accumulative';

/** Where the number comes from */
export type ValueOrigin = 'entity' | 'static' | 'event';

/**
 * Describes how a single numeric value (node content, edge flow, inventory qty)
 * is obtained and interpreted. Orthogonal to node capabilities.
 */
export interface ValueSource {
  origin: ValueOrigin;
  kind:   ValueKind;
  unit:   string;

  // ── entity origin ────────────────────────────────────────────────────────────
  /** Primary HA entity ID, e.g. 'sensor.solar_inverter_power' */
  entityId?:   string;
  /** Optional attribute name; defaults to 'state' */
  entityAttr?: string;

  // ── static origin ────────────────────────────────────────────────────────────
  /** The hardcoded numeric value */
  staticValue?: number;
  /**
   * When set, a HA helper has been provisioned and the static value is now
   * managed through it (treated the same as entity origin at runtime).
   */
  haHelperEntityId?: string;

  // ── event origin ─────────────────────────────────────────────────────────────
  /** For trigger/event→flow: the HA entity whose state drives the value */
  triggerEntityId?: string;
  /** Maps entity state string → numeric value, e.g. { 'on': 1500, 'off': 0 } */
  triggerValueMap?: Record<string, number>;

  /** For manual override (type 6): the last user-asserted value */
  overrideValue?: number;
  /** Optional HA entity to write the override back to */
  overrideEntityId?: string;
}

/** Convenience factory for the most common case: a static accumulative value */
export function staticValue(value: number, unit: string): ValueSource {
  return { origin: 'static', kind: 'accumulative', unit, staticValue: value };
}

/** Convenience factory for a static flow rate */
export function staticFlow(value: number, unit: string): ValueSource {
  return { origin: 'static', kind: 'flow', unit, staticValue: value };
}

/** Convenience factory for an entity-bound flow (live sensor) */
export function entityFlow(entityId: string, unit: string): ValueSource {
  return { origin: 'entity', kind: 'flow', unit, entityId };
}

/** Convenience factory for an entity-bound accumulative value */
export function entityAccum(entityId: string, unit: string): ValueSource {
  return { origin: 'entity', kind: 'accumulative', unit, entityId };
}

// ─── Node Capabilities ─────────────────────────────────────────────────────────

/** What roles a node can play — any combination is valid */
export interface NodeCapabilities {
  canProduce: boolean;
  canConsume: boolean;
  canStore:   boolean;
}

// ─── Inventory Item ────────────────────────────────────────────────────────────

/**
 * A single stockable item inside an inventory node.
 * Each item has its own ValueSource so it can be bound to any HA entity
 * independently (counter, input_number, sensor, etc.)
 */
export interface InventoryItem {
  id:              string;
  name:            string;
  unit:            string;
  targetQuantity?: number;
  cost?:           number;
  /** Where this item's current quantity comes from */
  valueSource:     ValueSource;
}

// ─── Node Data ─────────────────────────────────────────────────────────────────

/** Data shape for the unified ResourceNode */
export interface ResourceNodeData {
  label:        string;
  resourceType: ResourceType;
  capabilities: NodeCapabilities;

  /** The node's own physical state / content (what IS here, not what flows) */
  valueSource: ValueSource;

  // Storage-specific
  maxCapacity?:    number;
  /** Source for the maximum capacity value itself (e.g. sensor.battery_capacity) */
  capacitySource?: ValueSource;
  capacityUnit?:   string;

  costPerUnit?: number;
  nestedHubId?: string;
  actuator?:    { type: 'switch' | 'valve' | 'button'; entityId?: string; state: boolean };
  customIcon?:  string;

  /** Inventory items — each with its own independent ValueSource */
  inventory?: InventoryItem[];
}

/** Legacy alias so old node components compile unchanged */
export interface BaseNodeData extends ResourceNodeData {}

// ─── Edge Data ─────────────────────────────────────────────────────────────────

/**
 * Data carried on each edge.
 * Edges represent the *movement* of a resource between two nodes.
 * The flowSource defines how much moves and from where that number comes.
 */
export interface EdgeData {
  /** How much resource flows along this edge, and from where that number comes */
  flowSource:    ValueSource;
  resourceType?: ResourceType;
  label?:        string;
}

// ─── Hub ───────────────────────────────────────────────────────────────────────

export interface Hub {
  id:              string;
  name:            string;
  primaryResource: ResourceType;
  status:          'ok' | 'warning' | 'alert';
  ingressTotal24h?: number;
  egressTotal24h?:  number;
  unit:            string;
}

// ─── View State ────────────────────────────────────────────────────────────────

export type ViewState = 'dashboard' | 'hubGraph';
