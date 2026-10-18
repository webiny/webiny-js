import { createAbstraction } from "@webiny/feature/admin";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";

// The per-app parts the shared view passes in (the 8a mounting pattern).
export interface WorkflowEditorInitParams {
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

export type WorkflowEditorStatus = "loading" | "ready" | "failed" | "noAccess";

// What the right side shows: nothing, a loading workflow, a model without a workflow, or a draft.
export type WorkflowEditorDetailKind = "none" | "loading" | "empty" | "workflow";

export interface ModelRowVm {
    modelId: string;
    name: string;
    // `{n} steps`, the bound workflow's name or `No workflow` (R280).
    subLine: string;
    bound: boolean;
    unsaved: boolean;
    active: boolean;
}

export interface ModelPanelVm {
    label: string;
    showSearch: boolean;
    search: string;
    rows: ModelRowVm[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    // `No models match “{q}”.` or null.
    emptyText: string | null;
    // `Could not load workflows` when a search or a page failed, else null.
    error: string | null;
}

export interface WorkflowHeaderVm {
    name: string;
    nameError: string | null;
    // `Applies to {Model} · {appliesToLabel}`.
    appliesTo: string;
    dirty: boolean;
    saving: boolean;
    canSave: boolean;
    // A workflow that exists on the server can be deleted; a new draft cannot.
    canDelete: boolean;
}

export interface EmptyWorkflowVm {
    title: string;
    description: string;
}

export interface OptionsBannerVm {
    message: string;
}

// One step card, render-ready (R234).
export interface StepCardVm {
    id: string;
    number: number;
    // `Untitled step` when the draft title is empty.
    title: string;
    // A `var(--color-...)` preset, `#RRGGBB`, or the neutral fallback for an empty colour.
    color: string;
    // `People`, `Automation`, `AI` or the server title of an unknown type (R269).
    typeLabel: string;
    type: string;
    summary: string;
    readOnly: boolean;
    warnings: string[];
    // The first client or server error of the step, shown as the card strip, or null.
    error: string | null;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

export interface WorkflowFlowVm {
    steps: StepCardVm[];
    // `Add at least one step.` or a server `steps` error, shown in the `No steps yet` box.
    stepsError: string | null;
}

export interface TypePickerVm {
    // Where the chosen step is inserted.
    index: number;
    options: StepTypeOption[];
}

// The card the view scrolls into view after a failed save; `nonce` changes on every request.
export interface ScrollRequestVm {
    stepId: string;
    nonce: number;
}

// The state of the saved-reference resolution, for the pickers' neutral label (R298).
export interface ReferencesStatus {
    loading: boolean;
    failed: boolean;
}

export interface WorkflowTeamOptions {
    // The last search's results.
    results: WorkflowTeamSummary[];
    // Every team seen by id: resolved at load and from every search.
    known: WorkflowTeamSummary[];
    loading: boolean;
    failed: boolean;
}

export interface DialogReviewVm {
    reviewId: string;
    title: string;
    // `Step {n} of {N} · {step}`.
    position: string;
    url: string;
}

export type WorkflowEditorDialogKind =
    | "discardChanges"
    | "deleteStep"
    | "conflict"
    | "deleted"
    | "deleteWorkflow"
    | "blockedDelete"
    | "reloadWorkflow";

/*
 * The one dialog the editor's presenters share (Task 18 renders it). `confirmLabel` is null when
 * only the secondary button exists (the blocked delete dialog's Close). `note` is a closing
 * sentence below the list. `destructive` styles the confirm button, `cancelDestructive` the
 * secondary one.
 */
export interface WorkflowEditorDialogVm {
    kind: WorkflowEditorDialogKind;
    title: string;
    body: string;
    note: string | null;
    reviews: DialogReviewVm[];
    confirmLabel: string | null;
    cancelLabel: string;
    destructive: boolean;
    cancelDestructive: boolean;
    busy: boolean;
}

export type SaveBannerKind = "message" | "duplicate" | "transport";

/*
 * The destructive banner under the header after a failed save. `title` is null for a one-line
 * banner. The view shows Reload when `canReload` (it calls `reloadDuplicate`), Try again when
 * `canRetry` (`retrySave`) and a dismiss button when `dismissible` (`dismissBanner`).
 */
export interface SaveBannerVm {
    kind: SaveBannerKind;
    title: string | null;
    message: string;
    canReload: boolean;
    canRetry: boolean;
    dismissible: boolean;
}

export interface IWorkflowEditorViewModel {
    status: WorkflowEditorStatus;
    // The message of a failed load (`status` `failed`), else null.
    error: string | null;
    panel: ModelPanelVm;
    detail: WorkflowEditorDetailKind;
    // The open workflow or draft, null when none.
    header: WorkflowHeaderVm | null;
    // The open model has no workflow, else null.
    empty: EmptyWorkflowVm | null;
    flow: WorkflowFlowVm;
    typePicker: TypePickerVm | null;
    // The step the drawer shows, or null (R284).
    openStepId: string | null;
    scrollRequest: ScrollRequestVm | null;
    optionsBanner: OptionsBannerVm | null;
    saveBanner: SaveBannerVm | null;
    dialog: WorkflowEditorDialogVm | null;
}

export type OptionListStatus = "loading" | "ready" | "failed";

// One lookup list and where it stands, so an empty list is never shown as a failure (R284).
export interface OptionList<T> {
    status: OptionListStatus;
    items: T[];
}

/*
 * Domain data the step drawer's forms are built from (not part of the VM, R234). A list that was
 * not requested (the AI lists without the AI editor) is `ready` with no items.
 */
export interface WorkflowEditorOptions {
    stepTypes: OptionList<EditorStepType>;
    automations: OptionList<AutomationDefinition>;
    transports: OptionList<NotificationTransport>;
    aiModels: OptionList<AiModel>;
    aiTools: OptionList<AiTool>;
}

export interface IWorkflowEditorPresenter {
    readonly vm: IWorkflowEditorViewModel;
    init(params: WorkflowEditorInitParams): Promise<void>;
    // Runs `init` again after a failed load (and reopens the model whose workflow did not load).
    retry(): Promise<void>;
    // Reloads every option list and the team names of the open workflow.
    retryOptions(): Promise<void>;
    retryModels(): Promise<void>;
    // Validates, then stores the draft with the loaded `savedOn` (R276).
    save(): Promise<void>;
    // Try again of the transport banner.
    retrySave(): Promise<void>;
    dismissBanner(): void;
    // Reload of the duplicate banner: asks, then opens the workflow the model already has.
    reloadDuplicate(): void;
    // The `Delete workflow` menu item: asks first (R278).
    requestDelete(): void;
    setSearch(search: string): void;
    loadMore(): Promise<void>;
    selectModel(modelId: string): Promise<void>;
    createWorkflow(): void;
    setName(name: string): void;
    openTypePicker(index: number): void;
    closeTypePicker(): void;
    // Opens the step (R284).
    openStep(stepId: string): void;
    closeStep(): void;
    // Returns the new step's id (and opens it), or null when the type is not addable.
    addStep(index: number, type: string): string | null;
    moveStep(from: number, to: number): void;
    requestDeleteStep(stepId: string): void;
    // Accessors for the step drawer (Task 14), not part of the VM (R234).
    getStep(stepId: string): EditorStep | null;
    updateStep(stepId: string, patch: EditorStepPatch): void;
    getStepFieldErrors(stepId: string): StepFieldError[];
    isStepReadOnly(stepId: string): boolean;
    // The open model's namespace (`cms.article`, `wb.page`), null with no model open.
    getNamespace(): string | null;
    getTeamOptions(): WorkflowTeamOptions;
    searchTeams(search: string): void;
    retryTeams(): Promise<void>;
    // The resolved users, rule teams and folders of the open workflow (R298).
    getReferences(): RuleReferences;
    // Whether a resolution run is in flight and whether the last one left ids unresolved.
    getReferencesStatus(): ReferencesStatus;
    // Resolves only the ids that are still unresolved, and loads the folder list again after a failure.
    retryReferences(): void;
    // The primary button of the open dialog.
    confirmDialog(): Promise<void>;
    // The secondary button of the open dialog.
    cancelDialog(): void;
    getOptions(): WorkflowEditorOptions;
    dispose(): void;
}

export const WorkflowEditorPresenter = createAbstraction<IWorkflowEditorPresenter>(
    "Workflows/WorkflowEditorPresenter"
);

export namespace WorkflowEditorPresenter {
    export type Interface = IWorkflowEditorPresenter;
    export type ViewModel = IWorkflowEditorViewModel;
}
