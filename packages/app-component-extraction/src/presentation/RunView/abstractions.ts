import { createAbstraction } from "@webiny/feature/admin";
import type { ThemeSnapshot } from "./themeSnapshot.js";
import type {
    SiteInventoryDto,
    SiteResultDto,
    ComponentPromptDto,
    AssembleArtifactDto,
    ComposedCaptureDto,
    PageMapDto,
    SiteDto,
    ComponentDecisionDto,
    GeneratedComponentDto,
    JobDto,
    ModelCallDto,
    OverrideDto,
    PlanCostProjectionDto,
    ReattachmentDto,
    RenderRecordDto,
    RunDto,
    StageLogItem,
    StageProgress,
    GeneratedComponentDetailDto,
    ComponentReviewDto,
    ReviewInputDto,
    ReviewOptionDto,
    GenerationLogEntryDto,
    GenerationPromptDto,
    ThemeFitDto,
    ThemeOptionDto
} from "~/shared/types.js";

export interface GenerationLogState {
    loading: boolean;
    entries: GenerationLogEntryDto[];
    error: string | null;
}

export interface GenerationPromptState {
    loading: boolean;
    prompt: GenerationPromptDto | null;
    error: string | null;
}

export interface IRunViewVm {
    loading: boolean;
    run: RunDto | null;
    job: JobDto | null;
    error: string | null;
    /** The stage whose detail panel is open. */
    selectedStage: string | null;
    /** The stage currently being triggered, so its Run button can show a busy state. */
    actionStage: string | null;
    /**
     * A stage the ledger calls running whose background task has stopped (failed, aborted, or ended
     * without finishing the stage). The only state where resuming the stage is offered.
     */
    stalledStage: { stage: string; taskStatus: string } | null;
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
    /** Signatures whose single-component re-render is in flight, so each card can show its own state. */
    renderingSignatures: string[];
    /** Accept/reject decisions per component signature (W7.8). */
    decisions: Record<string, ComponentDecisionDto>;
    /**
     * Human review verdicts per component signature — the measure Realpage reads. Separate from the
     * decisions: a verdict is logged only, and never changes what Promote moves.
     */
    reviews: Record<string, ComponentReviewDto>;
    /** The verdict levels and reasons to offer, as the API names them. Empty until loaded. */
    reviewVerdicts: ReviewOptionDto[];
    reviewReasons: ReviewOptionDto[];
    /** Signatures whose review is being saved, so each card can show its own state. */
    savingReviews: string[];
    /** Signatures whose generation log is open on its card. */
    openLogs: string[];
    /** Each opened component's generation log, loaded when first opened. */
    generationLogs: Record<string, GenerationLogState>;
    /** Each attempt's prompt, by log entry id, loaded when the attempt is opened. */
    generationPrompts: Record<string, GenerationPromptState>;
    /** Source section crop ref per component signature, from the Plan artifact. */
    sourceCrops: Record<string, string>;
    /** Signatures of components whose regenerate (refine) is in flight (W7.8). */
    regenerating: string[];
    /** Signatures of components whose Plan-contract regenerate is in flight (W8). */
    planRegenerating: string[];
    /** The token-usage panel is open (W7.9), replacing the artifact panel. */
    showTokens: boolean;
    /** How well the job's theme fits what was measured, once Plan has run; null before. */
    themeFit: ThemeFitDto | null;
    /** What extraction set on the job's theme, for the theme card's palette; null until loaded. */
    themeSnapshot: ThemeSnapshot | null;
    /** Published themes, for "Use an existing theme"; loaded when that is opened. */
    themeChoices: ThemeOptionDto[];
    /** A theme action in flight (retry, use existing), so its buttons can show it. */
    themeBusy: boolean;
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
    /** The overrides panel is open (W8.7), replacing the artifact panel. */
    showOverrides: boolean;
    /** The composed-pages panel. Composition is not a stage, so it sits beside the stage views. */
    showComposed: boolean;
    /** The run's page map, null until loaded or when the run has never been composed. */
    pageMap: PageMapDto | null;
    /**
     * Where `pageMap` lives, for a job that composes in its site tenant: that tenant, and whether the
     * map is the drafts of a preview or the published site. Null for older jobs, whose composition is in
     * the extraction tenant.
     */
    composedIn: { tenantId: string; drafts: boolean } | null;
    pageMapLoading: boolean;
    /**
     * The run's Assemble artifact, loaded with the page map. It carries each source page's capture
     * screenshot and its instance list, which is both halves of the comparison below the images.
     */
    composedAssemble: AssembleArtifactDto | null;
    /**
     * Screenshots of the composed pages, or null when nobody has run the local harness for this run.
     *
     * Null is the normal state and the view says so plainly. Nothing in this project can photograph a
     * composed page by itself — the website app that renders them links an unpublished SDK and cannot
     * be deployed — so a missing composed half means nobody has run the step, not that the migration
     * failed. See `ComposedCaptureDto`.
     */
    composedCapture: ComposedCaptureDto | null;
    /**
     * Where the migrated site is served from — Website Builder's preview domain, loaded with the map.
     *
     * Null when it is unset, and the view says so rather than opening a URL built on an empty string.
     */
    websiteDomain: string | null;
    /**
     * The page each composed path actually resolves to, keyed by path.
     *
     * A run's page map says which page it created for a path; this says which page a visitor reaches
     * there. They differ whenever another composition has claimed the path, and the panel must say so
     * — otherwise Open and Edit on one row lead to two different pages with nothing explaining it.
     */
    livePageByPath: Record<string, string | null>;
    /**
     * A composition is running and its result is not in yet.
     *
     * Composition is not a stage, so there is no ledger entry to watch and no websocket event. The
     * page map changing is the only thing that says it finished, which is what the presenter polls.
     */
    composing: boolean;
    /** The job's site in its own tenant, loaded with the run; null when it has none. */
    site: SiteDto | null;
    /**
     * The Site view is open (the rail entry after the stages). Like the composed pages panel it is not a
     * stage: the site belongs to the job and has no ledger entry.
     */
    showSite: boolean;
    /**
     * The page map of the site's last build, read in the SITE'S tenant. The composed pages panel reads
     * the extraction tenant's composition, which is a different set of pages at the same paths.
     */
    sitePageMap: PageMapDto | null;
    sitePageMapLoading: boolean;
    /** Which page each of the site's paths serves, asked inside the site's tenant. */
    siteLivePageByPath: Record<string, string | null>;
    /** How many pages this run assembled, which is what a build publishes; null until known. */
    siteAssembledCount: number | null;
    /**
     * The run the site was last built from, by its number. The site's pages are that run's, which need
     * not be the run on screen: opened on run 5, a site built from run 3 lists run 3's pages, and reads
     * as broken unless the view says so.
     */
    siteBuiltFrom: { runId: string; runNumber: number | null } | null;
    /**
     * What the site's tenant holds beyond what its live pages use. Builds never delete, and stage 9
     * keeps both when a name is taken, so every re-approval leaves a component no page uses.
     */
    siteInventory: SiteInventoryDto | null;
    /** What the Site step shows as the result, site-wide and per page. Null before a publish. */
    siteResult: SiteResultDto | null;
    /** A site build was started from this screen and has not reported done or failed yet. */
    buildingSite: boolean;
    /** A re-capture of selected pages is in flight. */
    recapturing: boolean;
    /** The composed page the comparison is open on, by its Website Builder path. */
    comparedPath: string | null;
    /** This run's override reattachment outcomes (W8.7). */
    reattachments: ReattachmentDto[];
    /** The generated components eligible for Promotion, for the Promote gate (W8.6). */
    promoteComponents: GeneratedComponentDto[];
    /** The Promote gate's inputs have loaded, so an empty `promoteComponents` means none, not "not yet". */
    promoteGateLoaded: boolean;
    /** Names already in the Library, for Promote collision detection (W8.6). */
    libraryNames: string[];
}

export interface IRunViewPresenter {
    vm: IRunViewVm;
    init(runId: string): Promise<void>;
    refresh(): Promise<void>;
    /** Extract the job's theme again: after a failure, or (confirmed) to replace a theme it has. */
    retryTheme(): Promise<void>;
    /** Pin an existing published theme instead of the extracted one. */
    useExistingTheme(themeId: string): Promise<void>;
    /** Load the published themes the user can pick from. */
    loadThemeChoices(): Promise<void>;
    runStage(stage: string): Promise<void>;
    selectStage(stage: string): void;
    /** Apply a live progress update pushed over the websocket for a stage. */
    applyProgress(stage: string, progress: StageProgress, held?: boolean): void;
    /** Exclude or re-include a discovered URL, as a discover.url override that reattaches across runs. */
    setDiscoverExclusion(url: string, excluded: boolean): Promise<void>;
    /** Add a manual URL to Discover's list, as a discover.url override. */
    addDiscoverUrl(url: string): Promise<void>;
    /** Drop captured/failed pages, then refresh the run and the open artifact. */
    excludeCapturedPages(urls: string[]): Promise<void>;
    /** Read the selected captured pages again, replacing them in place. */
    recapturePages(urls: string[]): Promise<void>;
    /** Trigger the rendered-component screenshot pass. With a signature, re-renders just that one. */
    renderComponents(signature?: string): Promise<void>;
    /** Set (or clear, with "none") a generated component's accept/reject decision (W7.8). */
    setDecision(signature: string, decision: string): Promise<void>;
    /** Accept every listed component (the validation-passing ones) in one action. */
    acceptAll(signatures: string[]): Promise<void>;
    /** Open or close a component's generation log; loads it (again) on opening. */
    toggleGenerationLog(signature: string): Promise<void>;
    /** Load one attempt's prompt, once. */
    loadGenerationPrompt(signature: string, entryId: string): Promise<void>;
    /** Record a human review verdict on a component's current output. */
    setReview(signature: string, review: ReviewInputDto): Promise<void>;
    /** Regenerate a component from an instruction via the refine path (W7.8). */
    regenerateComponent(signature: string, instruction: string): Promise<void>;
    regeneratePlanComponent(signature: string, instruction?: string): Promise<void>;
    /** Toggle the token-usage panel; loads the call list on first open (W7.9). */
    loadComponentDetail(
        runId: string,
        signature: string
    ): Promise<GeneratedComponentDetailDto | null>;
    loadComponentPrompt(runId: string, signature: string): Promise<ComponentPromptDto | null>;
    toggleTokens(): void;
    /** Toggle the overrides panel; loads the job's overrides + this run's reattachments (W8.7). */
    toggleOverrides(): void;
    /**
     * Open or close the composed-pages panel, and with it one page's comparison.
     *
     * A setter, not a toggle, because the route owns this panel's state — see the implementation.
     * The view calls it from an effect on the route params; nothing else should call it.
     */
    openComposed(open: boolean, comparedPath: string | null): void;
    /** Compose this run's pages, then reload the map. Gated on Assemble and Promote being done. */
    composePages(): Promise<void>;
    /** Build the job's site in its own tenant, following the build until it finishes. */
    buildSite(): Promise<void>;
    /** Open the Site view, closing whatever pane or stage view was showing. */
    openSite(): void;
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
    /** Set the cluster similarity threshold and re-run Cluster (W8.3). */
    applyThreshold(threshold: number): Promise<void>;
    /** Set the section-container height and re-run Segment (W11 diagnosis). */
    applySegmentMaxHeight(maxSectionHeight: number): Promise<void>;
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
    /** Select or deselect a component for Promotion (W8.6). */
    setPromoteSelection(signature: string, selected: boolean): Promise<void>;
    /** Resolve a Promote name collision — replace, or keep both with a rename (W8.6). */
    setPromoteCollision(
        signature: string,
        resolution: "replace" | "keepBoth",
        renameTo?: string
    ): Promise<void>;
}

export const RunViewPresenter = createAbstraction<IRunViewPresenter>(
    "ComponentExtraction/RunViewPresenter"
);

export namespace RunViewPresenter {
    export type Interface = IRunViewPresenter;
    export type ViewModel = IRunViewVm;
}
