import { createAbstraction } from "@webiny/feature/admin";
import type {
    ExperimentDto,
    UpdateExperimentInput,
    VariantContentDto,
    VariantDto
} from "~/features/experiments/index.js";
import type { NewExperimentPayload } from "../../ExperimentForm/abstractions/ExperimentFormPresenter.js";

/** A single "thing you can edit" within an experiment: the control, or one of its variants. */
export interface VariantOption {
    // `null` identifies the control (the baseline page); otherwise the variant entry id.
    id: string | null;
    name: string;
    weight: number;
    isControl: boolean;
}

export interface IExperimentsEditorViewModel {
    // Revision id of the page being edited; the baseline for its experiments.
    baselineRevisionId: string;
    // Entry id of the page being edited (derived from the baseline revision id).
    pageEntryId: string;
    experiments: ExperimentDto[];
    selectedExperimentId: string | null;
    selectedExperiment: ExperimentDto | null;
    // Currently edited bucket: `null` = control, otherwise a variant entry id.
    selectedVariantId: string | null;
    // The variant DTO matching `selectedVariantId` (null when editing the control).
    selectedVariant: VariantDto | null;
    variantOptions: VariantOption[];
    // Kill-switch state of the selected experiment.
    paused: boolean;
    // Manage/edit drawer UI state.
    drawerOpen: boolean;
    editTarget: ExperimentDto | null;
}

export interface IExperimentsEditorPresenter {
    readonly vm: IExperimentsEditorViewModel;
    init(pageRevisionId: string): void;
    reload(): Promise<void>;
    selectExperiment(id: string | null): void;
    selectVariant(variantId: string | null): void;
    // On a published (read-only) page, keep the running experiment selected so the preview tracks it.
    syncReadOnlySelection(isReadOnly: boolean): void;
    openManage(): void;
    editExperiment(experiment: ExperimentDto): void;
    closeDrawer(): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    activate(experimentId: string): Promise<ExperimentDto>;
    deactivate(experimentId: string): Promise<ExperimentDto>;
    createExperiment(payload: NewExperimentPayload): Promise<ExperimentDto>;
    updateExperiment(id: string, input: UpdateExperimentInput): Promise<ExperimentDto>;
    deleteExperiment(experimentId: string): Promise<boolean>;
    getVariant(id: string): Promise<VariantContentDto | null>;
    saveVariant(revisionId: string, doc: Record<string, any>): Promise<VariantDto>;
}

export const ExperimentsEditorPresenter = createAbstraction<IExperimentsEditorPresenter>(
    "WebsiteBuilder/ExperimentsEditor/Presenter"
);

export namespace ExperimentsEditorPresenter {
    export type Interface = IExperimentsEditorPresenter;
    export type ViewModel = IExperimentsEditorViewModel;
    export type Option = VariantOption;
}
