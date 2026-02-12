const ViewModes = ['tree', 'flat'] as const;

export type ViewModeType = (typeof ViewModes)[number];

export { ViewModes };
