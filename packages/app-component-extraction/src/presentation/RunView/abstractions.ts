import { createAbstraction } from "@webiny/feature/admin";
import type {
    ComponentDecisionDto,
    JobDto,
    ModelCallDto,
    OverrideDto,
    PlanCostProjectionDto,
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
    /** Signatures of components whose regenerate (refine) is in flight (W7.8). */
    regenerating: string[];
    /** The token-usage panel is open (W7.9), replacing the artifact panel. */
    showTokens: boolean;
    /** A run's individual model calls for the token panel; null until loaded. */
    modelCalls: ModelCallDto[] | null;
    modelCallsLoading: boolean;
    /** The Plan-gate cost projection (W7.9), loaded when the Plan stage is open and done. */
    planProjection: PlanCostProjectionDto | null;
    /** The job's active overrides (W8), loaded when a correctable stage is open. */
    overrides: OverrideDto[];
    /** The open stage's machine (un-overridden) artifact, so a corrected item can show its original value. */
    machineArtifact: unknown;
    machineArtifactStage: string | null;
    /** Cluster signatures currently selected for a bulk correction (merge/exclude) (W8.3). */
    selectedClusters: string[];
    /** A correction is being applied, so the controls show a busy state (W8.3+). */
    clusterBusy: boolean;
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
    /** Regenerate a component from an instruction via the refine path (W7.8). */
    regenerateComponent(signature: string, instruction: string): Promise<void>;
    /** Toggle the token-usage panel; loads the call list on first open (W7.9). */
    toggleTokens(): void;
    /** Toggle a cluster's selection for a bulk correction (W8.3). */
    toggleClusterSelection(signature: string): void;
    /** Clear the cluster selection (W8.3). */
    clearClusterSelection(): void;
    /** Merge the selected clusters, optionally pinning a representative (W8.3). */
    mergeSelectedClusters(pinnedSignature?: string): Promise<void>;
    /** Split the given members out of a cluster into a new one (W8.3). */
    splitClusterMembers(sourceSignature: string, memberSignatures: string[]): Promise<void>;
    /** Move a member to another cluster (W8.3). */
    moveClusterMember(memberSignature: string, targetSignature: string): Promise<void>;
    /** Exclude a cluster from the run (W8.3). */
    excludeCluster(signature: string): Promise<void>;
    /** Clear an override, reverting that item to machine output (W8.3). */
    clearOverride(overrideId: string): Promise<void>;
    /** Set a cluster's name and/or type (W8.4 classify controls). */
    setClassification(signature: string, name?: string, type?: string): Promise<void>;
    /** Edit, add or remove a planned component's prop (W8.5 plan controls). */
    setPlanProp(
        signature: string,
        op: "edit" | "add" | "remove",
        propName: string,
        extra?: { newName?: string; type?: string }
    ): Promise<void>;
}

export const RunViewPresenter = createAbstraction<IRunViewPresenter>(
    "ComponentExtraction/RunViewPresenter"
);

export namespace RunViewPresenter {
    export type Interface = IRunViewPresenter;
    export type ViewModel = IRunViewVm;
}
