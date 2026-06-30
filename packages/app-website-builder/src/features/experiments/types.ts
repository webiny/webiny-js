export interface ExperimentDto {
    id: string;
    entryId: string;
    pageEntryId: string;
    baselineRevisionId: string;
    status: string;
    name: string;
    trafficSplit: Record<string, any> | null;
    targeting: Record<string, any> | null;
    goals: Record<string, any> | null;
    analytics: Record<string, any> | null;
    startedOn: string | null;
    stoppedOn: string | null;
    winningVariantId: string | null;
    createdOn: string | null;
    savedOn: string | null;
}

export interface VariantDto {
    id: string;
    entryId: string;
    experimentId: string;
    name: string;
    status: string;
    properties: Record<string, any> | null;
    metadata: Record<string, any> | null;
    bindings: Record<string, any> | null;
    elements: Record<string, any> | null;
    extensions: Record<string, any> | null;
    createdOn: string | null;
    savedOn: string | null;
}

export interface ExperimentCreateInput {
    pageEntryId: string;
    baselineRevisionId: string;
    name: string;
    trafficSplit?: Record<string, any>;
    targeting?: Record<string, any>;
    goals?: Record<string, any>;
    analytics?: Record<string, any>;
}

export interface ExperimentUpdateInput {
    name?: string;
    trafficSplit?: Record<string, any>;
    targeting?: Record<string, any>;
    goals?: Record<string, any>;
    analytics?: Record<string, any>;
}

export interface VariantCreateInput {
    experimentId: string;
    name: string;
}

export interface VariantUpdateInput {
    name?: string;
    status?: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}
