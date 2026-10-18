import { createAbstraction } from "@webiny/feature/admin";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
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

export interface DialogReviewVm {
    reviewId: string;
    title: string;
    // `Step {n} of {N} · {step}`.
    position: string;
    url: string;
}

export type WorkflowEditorDialogKind = "discardChanges";

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
    optionsBanner: OptionsBannerVm | null;
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
    setSearch(search: string): void;
    loadMore(): Promise<void>;
    selectModel(modelId: string): Promise<void>;
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
