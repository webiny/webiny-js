import { createAbstraction } from "@webiny/feature/admin";
import type {
    ComponentDecisionDto,
    JobDto,
    RenderRecordDto,
    RunDto,
    StageLogItem,
    StageProgress
} from "~/shared/types.js";

export interface IRunViewVm {
    loading: boolean;
    run: RunDto | null;
    job: JobDto | null;
    error: string | null;
    /** The stage whose detail panel is open. */
    selectedStage: string | null;
    /** The stage currently being triggered, so its Run button can show a busy state. */
    actionStage: string | null;
    /** Live progress per stage, delivered over the websocket, keyed by stage name. */
    progressByStage: Record<string, StageProgress>;
    /** The selected stage's task log trail. */
    logs: StageLogItem[];
    logsLoading: boolean;
    /** Which stage `logs` belongs to, so the panel knows whether they're for the open stage. */
    logsStage: string | null;
    /** The selected stage's structured artifact (for the visibility views), and which stage it's for. */
    artifact: unknown;
    artifactStage: string | null;
    artifactLoading: boolean;
    /** The rendered-component screenshots (W7.7), keyed by cluster signature; null until produced. */
    renders: RenderRecordDto[] | null;
    /** A render pass has been triggered and its screenshots are not in yet. */
    rendering: boolean;
    /** Accept/reject decisions per component signature (W7.8). */
    decisions: Record<string, ComponentDecisionDto>;
    /** Source section crop ref per component signature, from the Plan artifact. */
    sourceCrops: Record<string, string>;
}

export interface IRunViewPresenter {
    vm: IRunViewVm;
    init(runId: string): Promise<void>;
    refresh(): Promise<void>;
    runStage(stage: string): Promise<void>;
    selectStage(stage: string): void;
    /** Apply a live progress update pushed over the websocket for a stage. */
    applyProgress(stage: string, progress: StageProgress): void;
    /** Rewrite Discover's URL list, then refresh the run and the open artifact. */
    updateDiscoverUrls(urls: Array<{ url: string; group?: string }>): Promise<void>;
    /** Drop captured/failed pages, then refresh the run and the open artifact. */
    excludeCapturedPages(urls: string[]): Promise<void>;
    /** Trigger the rendered-component screenshot pass for this run (W7.7). */
    renderComponents(): Promise<void>;
    /** Set (or clear, with "none") a generated component's accept/reject decision (W7.8). */
    setDecision(signature: string, decision: string): Promise<void>;
}

export const RunViewPresenter = createAbstraction<IRunViewPresenter>(
    "ComponentExtraction/RunViewPresenter"
);

export namespace RunViewPresenter {
    export type Interface = IRunViewPresenter;
    export type ViewModel = IRunViewVm;
}
