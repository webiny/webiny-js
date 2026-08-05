import { createAbstraction } from "@webiny/feature/admin";
import type { ExperimentDto } from "~/features/experiments/index.js";
import type {
    ExperimentFormInitial,
    NewExperimentPayload
} from "../../ExperimentForm/abstractions/ExperimentFormPresenter.js";

/** Which view the drawer is currently showing. */
export type ExperimentsManagerView = "list" | "create" | "edit";

/** A single bucket (control or variant) summarised for a card's thumbnails/traffic bar/legend. */
export interface ExperimentCardBucket {
    key: string;
    name: string;
    weight: number;
    dot: string;
    band: string;
    isControl: boolean;
}

/** Per-experiment summary used to render a card without any per-card data loading. */
export interface ExperimentCardViewModel {
    experiment: ExperimentDto;
    active: boolean;
    buckets: ExperimentCardBucket[];
    variantCount: number;
}

export interface IExperimentsManagerViewModel {
    // Drawer visibility (driven by the hub presenter's manage/edit entry points).
    open: boolean;
    // Which sub-view the drawer is showing.
    view: ExperimentsManagerView;
    // The experiment being edited (null in list/create views).
    editTarget: ExperimentDto | null;
    // Initial form values for the edit view (null until loaded).
    editInitial: ExperimentFormInitial | null;
    // The page's experiments (mirrored from the hub presenter).
    experiments: ExperimentDto[];
    pageEntryId: string;
    baselineRevisionId: string;
    // Card summaries (variant thumbnails/traffic/legend), one per listed experiment.
    cards: ExperimentCardViewModel[];
}

export interface IExperimentsManagerPresenter {
    readonly vm: IExperimentsManagerViewModel;
    init(): void;
    dispose(): void;
    showList(): void;
    showCreate(): void;
    startEdit(experiment: ExperimentDto): Promise<void>;
    close(): void;
    createExperiment(payload: NewExperimentPayload): Promise<void>;
    updateExperiment(payload: NewExperimentPayload): Promise<void>;
    activateExperiment(experiment: ExperimentDto): Promise<void>;
    deactivateExperiment(experiment: ExperimentDto): Promise<void>;
    deleteExperiment(experiment: ExperimentDto): Promise<void>;
}

export const ExperimentsManagerPresenter = createAbstraction<IExperimentsManagerPresenter>(
    "WebsiteBuilder/ExperimentsManager/Presenter"
);

export namespace ExperimentsManagerPresenter {
    export type Interface = IExperimentsManagerPresenter;
    export type ViewModel = IExperimentsManagerViewModel;
    export type View = ExperimentsManagerView;
    export type Card = ExperimentCardViewModel;
    export type CardBucket = ExperimentCardBucket;
}
