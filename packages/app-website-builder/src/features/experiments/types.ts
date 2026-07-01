export interface ExperimentDto {
    id: string;
    entryId: string;
    pageEntryId: string;
    baselineRevisionId: string;
    status: string;
    name: string;
    trafficSplit: { control: number; variants: Record<string, number> } | null;
    targeting: Record<string, any> | null;
    analytics: Record<string, any> | null;
    startedOn: string | null;
    stoppedOn: string | null;
    winningVariantId: string | null;
}

export interface VariantDto {
    id: string;
    entryId: string;
    experimentId: string;
    name: string;
    status: string;
}

/** A variant with its full, editable page content. */
export interface VariantContentDto extends VariantDto {
    properties: Record<string, any> | null;
    metadata: Record<string, any> | null;
    bindings: Record<string, any> | null;
    elements: Record<string, any> | null;
    extensions: Record<string, any> | null;
}

export interface UpdateVariantInput {
    name?: string;
    status?: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface CreateExperimentInput {
    pageEntryId: string;
    baselineRevisionId: string;
    name: string;
    trafficSplit?: { control: number; variants: Record<string, number> };
    targeting?: Record<string, any>;
    analytics?: Record<string, any>;
}

export interface UpdateExperimentInput {
    name?: string;
    trafficSplit?: { control: number; variants: Record<string, number> };
    targeting?: Record<string, any>;
    analytics?: Record<string, any>;
}
