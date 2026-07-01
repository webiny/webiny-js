import { createAbstraction } from "@webiny/feature/admin";

export interface VariantVm {
    id: string;
    entryId: string;
    name: string;
    status: string;
}

export interface ExperimentVm {
    id: string;
    entryId: string;
    name: string;
    status: string;
    paused: boolean;
    startedOn: string | null;
    stoppedOn: string | null;
    winningVariantId: string | null;
    trafficSplit: { control: number; variants: Record<string, number> };
    variants: VariantVm[];
}

export interface ExperimentsViewModel {
    loading: boolean;
    busy: boolean;
    error: string | null;
    pageEntryId: string;
    baselineRevisionId: string;
    pageIsPublished: boolean;
    experiments: ExperimentVm[];
    hasRunningExperiment: boolean;
}

export interface IExperimentsPresenter {
    readonly vm: ExperimentsViewModel;
    init(params: {
        pageEntryId: string;
        baselineRevisionId: string;
        pageIsPublished: boolean;
    }): Promise<void>;
    createExperiment(name: string): Promise<void>;
    addVariant(experimentEntryId: string, name: string): Promise<void>;
    deleteVariant(experimentEntryId: string, variantId: string): Promise<void>;
    startExperiment(experimentEntryId: string): Promise<void>;
    stopExperiment(experimentEntryId: string): Promise<void>;
    pauseExperiment(experimentEntryId: string): Promise<void>;
    resumeExperiment(experimentEntryId: string): Promise<void>;
    graduateVariant(experimentEntryId: string, variantId: string): Promise<void>;
}

export const ExperimentsPresenter = createAbstraction<IExperimentsPresenter>(
    "WebsiteBuilder/ExperimentsPresenter"
);

export namespace ExperimentsPresenter {
    export type Interface = IExperimentsPresenter;
    export type ViewModel = ExperimentsViewModel;
}
