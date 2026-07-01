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
