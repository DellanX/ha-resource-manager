// Resource Types
export type ResourceType = 'electric' | 'water' | 'gas' | 'stock';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  targetQuantity?: number; // Defines physical goal thresholds
  entityId?: string; // Links this specific item to a Home Assistant entity natively
  entityType?: 'counter' | 'input_number' | 'sensor';
  cost?: number; // Used during shopping receipt checkouts
}

export interface BaseNodeData {
  id: string;
  label: string;
  resourceType: ResourceType;
  value: number; // e.g., current power draw, amount in stock
  unit: string;  // e.g., 'W', 'kWh', 'Gal', 'kg', 'units'
  maxCapacity?: number; // Allows calculating time to fill/empty
  capacityUnit?: string; // Physical unit for max capacity e.g. Ah, Wh, kWh
  costPerUnit?: number; // Optional tariff rate
  entities?: string[]; // HA entity IDs
  nestedHubId?: string; // Allows clicking the node to navigate deep into a sub-hub
  actuator?: {
    type: 'switch' | 'valve' | 'button';
    state: boolean;
  };
  customIcon?: string; // MDI path string if specified
  inventory?: InventoryItem[]; // Sub-items physically contained inside this component
}

export interface Hub {
  id: string;
  name: string;
  primaryResource: ResourceType;
  status: 'ok' | 'warning' | 'alert';
  ingressTotal24h?: number;
  egressTotal24h?: number;
  unit: string;
}

export type ViewState = 'dashboard' | 'hubGraph';
