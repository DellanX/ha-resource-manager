// Resource Types
export type ResourceType = 'electric' | 'water' | 'gas' | 'stock';

/** What roles a node can play — any combination is valid */
export interface NodeCapabilities {
  canProduce: boolean;
  canConsume: boolean;
  canStore: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  targetQuantity?: number;
  entityId?: string;
  entityType?: 'counter' | 'input_number' | 'sensor';
  cost?: number;
}

/** Data shape for the unified ResourceNode */
export interface ResourceNodeData {
  label: string;
  resourceType: ResourceType;
  capabilities: NodeCapabilities;
  value: number;
  unit: string;
  maxCapacity?: number;
  capacityUnit?: string;
  costPerUnit?: number;
  entities?: string[];
  nestedHubId?: string;
  actuator?: {
    type: 'switch' | 'valve' | 'button';
    state: boolean;
  };
  customIcon?: string;
  inventory?: InventoryItem[];
}

/** Legacy alias so old node components compile unchanged */
export interface BaseNodeData extends ResourceNodeData {}

/** Data carried on each edge */
export interface EdgeData {
  flowVolume?: number;
  resourceType?: ResourceType;
  entities?: string[];
  label?: string;
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
