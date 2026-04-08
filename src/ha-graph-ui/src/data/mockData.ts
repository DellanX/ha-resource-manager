import type { Hub } from '../types';
import type { Node, Edge } from 'reactflow';
import { mdiFridge, mdiShower, mdiSolarPower, mdiCartOutline, mdiChefHat } from '@mdi/js';

export const mockHubs: Hub[] = [
  { id: 'hub_main_electric', name: 'Main Electrical Panel', primaryResource: 'electric', status: 'ok',  ingressTotal24h: 30.5, egressTotal24h: 28.2, unit: 'kWh' },
  { id: 'hub_kitchen',       name: 'Kitchen',               primaryResource: 'electric', status: 'warning', ingressTotal24h: 12.0, egressTotal24h: 12.0, unit: 'kWh' },
  { id: 'hub_hvac',          name: 'HVAC System',           primaryResource: 'electric', status: 'ok',  ingressTotal24h: 8.5,  egressTotal24h: 8.5,  unit: 'kWh' },
  { id: 'hub_main_water',    name: 'Main Water Line',       primaryResource: 'water',    status: 'ok',  ingressTotal24h: 120,  egressTotal24h: 120,  unit: 'Gal' },
  { id: 'hub_pantry',        name: 'Kitchen Pantry',        primaryResource: 'stock',    status: 'alert', ingressTotal24h: 5, egressTotal24h: 12, unit: 'items' },
  { id: 'hub_gas',           name: 'Home Gas Network',      primaryResource: 'gas',      status: 'ok',  ingressTotal24h: 4.5,  egressTotal24h: 4.5,  unit: 'CCF' },
];

export const mockHubGraphs: Record<string, { nodes: Node[], edges: Edge[] }> = {
  'hub_main_electric': {
    nodes: [
      {
        id: 'grid', type: 'resourceNode', position: { x: 50, y: 200 },
        data: {
          label: 'Grid Tariffs', resourceType: 'electric', value: 2.4, unit: 'kW',
          capabilities: { canProduce: true, canConsume: true, canStore: false },
          entities: ['sensor.grid_import', 'sensor.grid_export'],
        },
      },
      {
        id: 'solar', type: 'resourceNode', position: { x: 50, y: 50 },
        data: {
          label: 'Solar Array', resourceType: 'electric', value: 4.2, unit: 'kW',
          capabilities: { canProduce: true, canConsume: false, canStore: false },
          customIcon: mdiSolarPower, entities: ['sensor.solar_inverter_power'],
        },
      },
      {
        id: 'battery', type: 'resourceNode', position: { x: 400, y: 150 },
        data: {
          label: 'Powerwall', resourceType: 'electric', value: 85, unit: '%',
          maxCapacity: 13.5, capacityUnit: 'kWh',
          capabilities: { canProduce: false, canConsume: false, canStore: true },
          entities: ['sensor.powerwall_charge'],
        },
      },
      {
        id: 'hvac', type: 'resourceNode', position: { x: 750, y: 50 },
        data: {
          label: 'Heat Pump', resourceType: 'electric', value: 1.8, unit: 'kW',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          entities: ['climate.home_hvac'],
        },
      },
      {
        id: 'kitchen_hub', type: 'resourceNode', position: { x: 750, y: 250 },
        data: {
          label: 'Kitchen Hub', resourceType: 'electric', value: 1.2, unit: 'kW',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          nestedHubId: 'hub_kitchen',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'solar',   target: 'battery',     type: 'animatedFlow', animated: true, data: { flowVolume: 4.2, entities: ['sensor.solar_to_battery'] } },
      { id: 'e2', source: 'grid',    target: 'battery',     type: 'animatedFlow', animated: true, data: { flowVolume: 2.4 } },
      { id: 'e3', source: 'battery', target: 'hvac',        type: 'animatedFlow', animated: true, data: { flowVolume: 1.8 } },
      { id: 'e4', source: 'battery', target: 'kitchen_hub', type: 'animatedFlow', animated: true, data: { flowVolume: 1.2 } },
    ],
  },

  'hub_kitchen': {
    nodes: [
      {
        id: 'subpanel', type: 'resourceNode', position: { x: 50, y: 150 },
        data: {
          label: 'Main Panel Feed', resourceType: 'electric', value: 1.2, unit: 'kW',
          capabilities: { canProduce: true, canConsume: false, canStore: false },
          nestedHubId: 'hub_main_electric',
        },
      },
      {
        id: 'kitchen_battery', type: 'resourceNode', position: { x: 400, y: 350 },
        data: {
          label: 'Backup Battery', resourceType: 'electric', value: 65, unit: '%',
          maxCapacity: 20, capacityUnit: 'kWh',
          capabilities: { canProduce: false, canConsume: false, canStore: true },
        },
      },
      {
        id: 'router', type: 'resourceNode', position: { x: 750, y: 350 },
        data: {
          label: 'Internet Router', resourceType: 'electric', value: 10, unit: 'W',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
        },
      },
      {
        id: 'kitchen_ups', type: 'resourceNode', position: { x: 750, y: 150 },
        data: {
          label: 'Server UPS', resourceType: 'electric', value: 30, unit: '%',
          maxCapacity: 1, capacityUnit: 'kWh',
          capabilities: { canProduce: false, canConsume: false, canStore: true },
        },
      },
      {
        id: 'server', type: 'resourceNode', position: { x: 1050, y: 150 },
        data: {
          label: 'Home Server', resourceType: 'electric', value: 50, unit: 'W',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
        },
      },
      {
        id: 'fridge', type: 'resourceNode', position: { x: 400, y: 50 },
        data: {
          label: 'Refrigerator', resourceType: 'electric', value: 0.2, unit: 'kW',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          customIcon: mdiFridge, entities: ['sensor.fridge_power'],
        },
      },
      {
        id: 'oven', type: 'resourceNode', position: { x: 400, y: 200 },
        data: {
          label: 'Kitchen Oven', resourceType: 'electric', value: 1.0, unit: 'kW',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          entities: ['switch.kitchen_oven'], actuator: { type: 'switch', state: true },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'subpanel',        target: 'fridge',          type: 'animatedFlow', animated: true, data: { flowVolume: 1 } },
      { id: 'e2', source: 'subpanel',        target: 'oven',            type: 'animatedFlow', animated: true, data: { flowVolume: 3 } },
      { id: 'e3', source: 'subpanel',        target: 'kitchen_battery', type: 'animatedFlow', animated: true, data: { flowVolume: 12 } },
      { id: 'e4', source: 'kitchen_battery', target: 'router',          type: 'animatedFlow', animated: true, data: { flowVolume: 10 } },
      { id: 'e5', source: 'subpanel',        target: 'kitchen_ups',     type: 'animatedFlow', animated: true, data: { flowVolume: 0.01 } },
      { id: 'e6', source: 'kitchen_ups',     target: 'server',          type: 'animatedFlow', animated: true, data: { flowVolume: 0.05 } },
    ],
  },

  'hub_main_water': {
    nodes: [
      {
        id: 'mains', type: 'resourceNode', position: { x: 50, y: 150 },
        data: {
          label: 'City Water Mains', resourceType: 'water', value: 4.0, unit: 'GPM',
          capabilities: { canProduce: true, canConsume: false, canStore: false },
          actuator: { type: 'valve', state: true }, entities: ['switch.main_water_valve'],
        },
      },
      {
        id: 'water_heater', type: 'resourceNode', position: { x: 400, y: 150 },
        data: {
          label: 'Water Heater', resourceType: 'water', value: 40, unit: 'Gal',
          capabilities: { canProduce: false, canConsume: false, canStore: true },
          entities: ['sensor.water_heater_temp'],
        },
      },
      {
        id: 'shower', type: 'resourceNode', position: { x: 750, y: 150 },
        data: {
          label: 'Master Shower', resourceType: 'water', value: 2.1, unit: 'GPM',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          customIcon: mdiShower,
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'mains',        target: 'water_heater', type: 'animatedFlow', animated: true, data: { flowVolume: 4 } },
      { id: 'e2', source: 'water_heater', target: 'shower',       type: 'animatedFlow', animated: true, data: { flowVolume: 4 } },
    ],
  },

  'hub_pantry': {
    nodes: [
      {
        id: 'grocery', type: 'resourceNode', position: { x: 50, y: 150 },
        data: {
          label: 'Grocery Run', resourceType: 'stock', value: 0, unit: 'trip',
          capabilities: { canProduce: true, canConsume: false, canStore: false },
          customIcon: mdiCartOutline, actuator: { type: 'button', state: false },
          inventory: [
            { id: 'eggs',  name: 'Eggs',  quantity: 12, unit: 'units', cost: 4.5 },
            { id: 'milk',  name: 'Milk',  quantity: 1,  unit: 'Gal',   cost: 3.2 },
            { id: 'flour', name: 'Flour', quantity: 2000, unit: 'g',   cost: 5.0 },
          ],
        },
      },
      {
        id: 'fridge', type: 'resourceNode', position: { x: 400, y: 50 },
        data: {
          label: 'Main Fridge', resourceType: 'stock', value: 20, unit: '%',
          maxCapacity: 100, customIcon: mdiFridge,
          capabilities: { canProduce: false, canConsume: false, canStore: true },
          inventory: [
            { id: 'eggs', name: 'Eggs', quantity: 3, unit: 'units', entityId: 'counter.egg_carton', entityType: 'counter' },
            { id: 'milk', name: 'Milk', quantity: 0.5, unit: 'Gal', entityId: 'input_number.milk_gallons', entityType: 'input_number' },
          ],
        },
      },
      {
        id: 'pantry', type: 'resourceNode', position: { x: 400, y: 250 },
        data: {
          label: 'Dry Pantry', resourceType: 'stock', value: 65, unit: '%',
          maxCapacity: 100,
          capabilities: { canProduce: false, canConsume: false, canStore: true },
          inventory: [
            { id: 'flour',    name: 'Flour',          quantity: 1200, unit: 'g',     targetQuantity: 2000 },
            { id: 'rice',     name: 'White Rice',     quantity: 3000, unit: 'g',     targetQuantity: 2800, entityId: 'sensor.rice_weight', entityType: 'sensor' },
            { id: 'beans',    name: 'Black Beans',    quantity: 4,    unit: 'cans',  targetQuantity: 8 },
            { id: 'sugar',    name: 'Sugar',          quantity: 800,  unit: 'g',     targetQuantity: 500 },
            { id: 'salt',     name: 'Sea Salt',       quantity: 200,  unit: 'g' },
            { id: 'pasta',    name: 'Spaghetti',      quantity: 3,    unit: 'boxes', targetQuantity: 10 },
            { id: 'oil',      name: 'Olive Oil',      quantity: 2,    unit: 'bottles', targetQuantity: 1 },
            { id: 'cereal',   name: 'Corn Flakes',    quantity: 1,    unit: 'box',   targetQuantity: 1 },
            { id: 'oats',     name: 'Oatmeal',        quantity: 1500, unit: 'g' },
            { id: 'coffee',   name: 'Coffee Beans',   quantity: 350,  unit: 'g',     targetQuantity: 500 },
            { id: 'tea',      name: 'Green Tea',      quantity: 40,   unit: 'bags' },
            { id: 'tomatoes', name: 'Diced Tomatoes', quantity: 6,    unit: 'cans',  targetQuantity: 5, entityId: 'counter.canned_tomatoes', entityType: 'counter' },
            { id: 'tuna',     name: 'Canned Tuna',    quantity: 8,    unit: 'cans' },
            { id: 'chips',    name: 'Tortilla Chips', quantity: 2,    unit: 'bags' },
            { id: 'crackers', name: 'Crackers',       quantity: 1,    unit: 'box' },
            { id: 'pb',       name: 'Peanut Butter',  quantity: 1,    unit: 'jar' },
            { id: 'jelly',    name: 'Grape Jelly',    quantity: 1,    unit: 'jar' },
            { id: 'choc',     name: 'Choc. Chips',    quantity: 2,    unit: 'bags' },
            { id: 'vanilla',  name: 'Vanilla Ext.',   quantity: 1,    unit: 'bottle' },
            { id: 'nuts',     name: 'Almonds',        quantity: 500,  unit: 'g' },
          ],
        },
      },
      {
        id: 'pancakes', type: 'resourceNode', position: { x: 750, y: 150 },
        data: {
          label: 'Bake Pancakes', resourceType: 'stock', value: 1, unit: 'batch',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          customIcon: mdiChefHat, actuator: { type: 'button', state: false },
          inventory: [
            { id: 'eggs',  name: 'Eggs',  quantity: 2,   unit: 'units' },
            { id: 'milk',  name: 'Milk',  quantity: 0.1, unit: 'Gal' },
            { id: 'flour', name: 'Flour', quantity: 250, unit: 'g' },
          ],
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'grocery', target: 'fridge',    type: 'animatedFlow', animated: false, data: { flowVolume: 0 } },
      { id: 'e2', source: 'grocery', target: 'pantry',    type: 'animatedFlow', animated: false, data: { flowVolume: 0 } },
      { id: 'e4', source: 'fridge',  target: 'pancakes',  type: 'animatedFlow', animated: false, data: { flowVolume: 0 } },
      { id: 'e5', source: 'pantry',  target: 'pancakes',  type: 'animatedFlow', animated: false, data: { flowVolume: 0 } },
    ],
  },

  'hub_gas': {
    nodes: [
      {
        id: 'gas_meter', type: 'resourceNode', position: { x: 50, y: 150 },
        data: {
          label: 'Utility Gas', resourceType: 'gas', value: 2.5, unit: 'CCF',
          capabilities: { canProduce: true, canConsume: false, canStore: false },
        },
      },
      {
        id: 'furnace', type: 'resourceNode', position: { x: 400, y: 50 },
        data: {
          label: 'Home Furnace', resourceType: 'gas', value: 2.0, unit: 'CCF',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          actuator: { type: 'switch', state: true },
        },
      },
      {
        id: 'gas_stove', type: 'resourceNode', position: { x: 400, y: 250 },
        data: {
          label: 'Kitchen Stove', resourceType: 'gas', value: 0.5, unit: 'CCF',
          capabilities: { canProduce: false, canConsume: true, canStore: false },
          actuator: { type: 'switch', state: false },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'gas_meter', target: 'furnace',   type: 'animatedFlow', animated: true, data: { flowVolume: 4 } },
      { id: 'e2', source: 'gas_meter', target: 'gas_stove', type: 'animatedFlow', animated: true, data: { flowVolume: 2 } },
    ],
  },
};
