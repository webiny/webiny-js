import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { isAiEditable } from "~/editor/model/isAiEditable.js";
import { WorkflowDraft } from "~/editor/model/WorkflowDraft.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";
import { WorkflowEditorPresenter as Abstraction } from "./abstractions.js";
import type { EmptyWorkflowVm } from "./abstractions.js";
import type { ModelPanelVm } from "./abstractions.js";
import type { OptionList } from "./abstractions.js";
import type { OptionsBannerVm } from "./abstractions.js";
import type { WorkflowEditorDetailKind } from "./abstractions.js";
import type { WorkflowEditorDialogVm } from "./abstractions.js";
import type { WorkflowEditorInitParams } from "./abstractions.js";
import type { WorkflowEditorOptions } from "./abstractions.js";
import type { WorkflowEditorStatus } from "./abstractions.js";
import type { WorkflowHeaderVm } from "./abstractions.js";
import { buildModelRowVms } from "./buildModelRowVms.js";
import { collectTeamIds } from "./collectTeamIds.js";
import { MODEL_PAGE_SIZE } from "./constants.js";
import { MODELS_FAILURE_MESSAGE } from "./constants.js";
import { OPTIONS_FAILURE_MESSAGE } from "./constants.js";
import { SEARCH_DEBOUNCE_MS } from "./constants.js";
import { TEAM_IDS_LIMIT } from "./constants.js";
import { discardChangesDialog } from "./dialogs/discardChangesDialog.js";
import { createOptionList } from "./optionLists.js";
import { toOptionList } from "./optionLists.js";
import type { PendingDialog } from "./PendingDialog.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { createNewStep } from "~/editor/model/createNewStep.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { getStepSummary } from "~/editor/model/getStepSummary.js";
import { getStepTypeLabel } from "~/editor/model/getStepTypeLabel.js";
import { getStepTypeOptions } from "~/editor/model/getStepTypeOptions.js";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import { getStepWarnings } from "~/editor/model/getStepWarnings.js";
import { isStepReadOnly } from "~/editor/model/isStepReadOnly.js";
import type { StepContext } from "~/editor/model/StepContext.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepValidationErrors } from "~/editor/model/StepFieldError.js";
import type { ScrollRequestVm } from "./abstractions.js";
import type { TypePickerVm } from "./abstractions.js";
import type { WorkflowFlowVm } from "./abstractions.js";
import type { WorkflowTeamOptions } from "./abstractions.js";
import { buildStepCardVm } from "./buildStepCardVm.js";
import { TEAM_SEARCH_LIMIT } from "./constants.js";
import { deleteStepDialog } from "./dialogs/deleteStepDialog.js";

function toMessage(error: unknown): string | null {
    return error instanceof Error ? error.message : null;
}

function mergeTeams(
    known: WorkflowTeamSummary[],
    incoming: WorkflowTeamSummary[]
): WorkflowTeamSummary[] {
    const merged = [...known];
    for (const team of incoming) {
        const index = merged.findIndex(item => item.id === team.id);
        if (index === -1) {
            merged.push(team);
        } else {
            merged[index] = team;
        }
    }
    return merged;
}

class WorkflowEditorPresenterImpl implements Abstraction.Interface {
    private params: WorkflowEditorInitParams | null = null;
    private status: WorkflowEditorStatus = "loading";
    private loadError: string | null = null;
    // The model whose workflow did not load, reopened by `retry`.
    private failedModelId: string | null = null;
    private rows: WorkflowModelRow[] = [];
    private cursor: string | null = null;
    private hasMore = false;
    private modelsLoading = false;
    private loadingMore = false;
    private modelsFailed = false;
    private searchDraft = "";
    private search = "";
    private selectedRow: WorkflowModelRow | null = null;
    private detail: WorkflowEditorDetailKind = "none";
    private stepTypes: OptionList<EditorStepType> = createOptionList("loading");
    private automations: OptionList<AutomationDefinition> = createOptionList("loading");
    private transports: OptionList<NotificationTransport> = createOptionList("loading");
    private aiModels: OptionList<AiModel> = createOptionList("loading");
    private aiTools: OptionList<AiTool> = createOptionList("loading");
    // Every team seen by id; the names of the open workflow's People steps are resolved into it.
    private teamsKnown: WorkflowTeamSummary[] = [];
    // The name lookup of the open workflow failed.
    private teamsFailed = false;
    private draft = new WorkflowDraft();
    private nameError: string | null = null;
    private saving = false;
    private pending: PendingDialog | null = null;
    private dialogBusy = false;
    private typePickerIndex: number | null = null;
    private openStepId: string | null = null;
    private stepsError: string | null = null;
    private stepErrors: StepValidationErrors[] = [];
    private scrollRequest: ScrollRequestVm | null = null;
    // The last team search's results, and whether a search is running or failed.
    private teamResults: WorkflowTeamSummary[] = [];
    private teamsLoading = false;
    private teamSearchFailed = false;
    private lastTeamSearch = "";
    private teamsToken = 0;
    private teamSearchTimer: ReturnType<typeof setTimeout> | null = null;
    // Generations: every init, dispose, search and open starts a new one and an older response is ignored.
    private runToken = 0;
    private modelToken = 0;
    private selectToken = 0;
    private optionsToken = 0;
    private resolveToken = 0;
    private modelSearchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private config: WorkflowConfigUseCases.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            WorkflowEditorPresenterImpl,
            | "config"
            | "identityContext"
            | "params"
            | "failedModelId"
            | "rows"
            | "selectedRow"
            | "stepTypes"
            | "automations"
            | "transports"
            | "aiModels"
            | "aiTools"
            | "teamsKnown"
            | "teamResults"
            | "stepErrors"
            | "scrollRequest"
            | "lastTeamSearch"
            | "teamsToken"
            | "teamSearchTimer"
            | "draft"
            | "pending"
            | "runToken"
            | "modelToken"
            | "selectToken"
            | "optionsToken"
            | "resolveToken"
            | "modelSearchTimer"
        >(this, {
            config: false,
            identityContext: false,
            params: observableRef,
            failedModelId: false,
            rows: observableRef,
            selectedRow: observableRef,
            stepTypes: observableRef,
            automations: observableRef,
            transports: observableRef,
            aiModels: observableRef,
            aiTools: observableRef,
            teamsKnown: observableRef,
            teamResults: observableRef,
            stepErrors: observableRef,
            scrollRequest: observableRef,
            lastTeamSearch: false,
            teamsToken: false,
            teamSearchTimer: false,
            draft: false,
            pending: observableRef,
            runToken: false,
            modelToken: false,
            selectToken: false,
            optionsToken: false,
            resolveToken: false,
            modelSearchTimer: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            status: this.status,
            error: this.status === "failed" ? this.loadError : null,
            panel: this.buildPanel(),
            detail: this.detail,
            header: this.buildHeader(),
            empty: this.buildEmpty(),
            flow: this.buildFlow(),
            typePicker: this.buildTypePicker(),
            openStepId: this.openStepId,
            scrollRequest: this.scrollRequest,
            optionsBanner: this.buildOptionsBanner(),
            dialog: this.buildDialog()
        };
    }

    async init(params: WorkflowEditorInitParams): Promise<void> {
        this.dispose();
        this.params = params;
        const token = this.runToken;

        const identity = this.identityContext.getIdentity();
        const permissions = getWorkflowsPermissionSet(identity);
        if (!permissions.editor) {
            this.status = "noAccess";
            return;
        }

        try {
            await params.app.init();
        } catch {
            // A failed adapter init only leaves the model icons empty: a workflows editor may lack
            // the CMS model permissions, and the editor must still open.
        }
        if (token !== this.runToken) {
            return;
        }

        await Promise.all([this.loadModels(false), this.loadOptions()]);
        if (token !== this.runToken || this.status !== "ready") {
            return;
        }
        const first = this.rows[0];
        if (first) {
            await this.openModel(first.modelId);
        }
    }

    async retry(): Promise<void> {
        const params = this.params;
        if (params === null || this.status !== "failed") {
            return;
        }
        const modelId = this.failedModelId;
        await this.init(params);
        // A model that is not on the first page cannot be reopened; the first model stays open.
        if (modelId !== null && this.vm.status === "ready") {
            await this.selectModel(modelId);
        }
    }

    async retryOptions(): Promise<void> {
        await this.loadOptions();
        await this.resolveTeams();
        // The banner also covers a failed team search of the drawer's picker (R284).
        if (this.teamSearchFailed) {
            await this.retryTeams();
        }
    }

    async retryModels(): Promise<void> {
        await this.loadModels(false);
    }

    setSearch(search: string): void {
        this.cancelModelSearchTimer();
        this.searchDraft = search;
        if (search === this.search) {
            return;
        }
        this.modelSearchTimer = setTimeout(() => {
            this.modelSearchTimer = null;
            void this.applySearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    async loadMore(): Promise<void> {
        if (!this.hasMore || this.loadingMore || this.modelsLoading || this.cursor === null) {
            return;
        }
        await this.loadModels(true);
    }

    async selectModel(modelId: string): Promise<void> {
        const selected = this.selectedRow;
        if (selected !== null && selected.modelId === modelId) {
            return;
        }
        if (this.draft.isDirty) {
            const row = this.rows.find(item => item.modelId === modelId);
            if (row) {
                this.pending = {
                    vm: discardChangesDialog(this.draft.name),
                    action: { kind: "switchModel", modelId }
                };
            }
            return;
        }
        await this.openModel(modelId);
    }

    createWorkflow(): void {
        const row = this.selectedRow;
        if (row === null || this.detail !== "empty") {
            return;
        }
        this.draft.startNew({
            id: generateAlphaNumericId(),
            name: `${row.name} review`,
            models: [row.model]
        });
        this.detail = "workflow";
    }

    setName(name: string): void {
        this.draft.setName(name);
        this.nameError = null;
    }

    openTypePicker(index: number): void {
        if (this.detail !== "workflow") {
            return;
        }
        this.typePickerIndex = index;
    }

    closeTypePicker(): void {
        this.typePickerIndex = null;
    }

    openStep(stepId: string): void {
        if (this.detail !== "workflow") {
            return;
        }
        if (this.draft.steps.some(step => step.id === stepId)) {
            this.openStepId = stepId;
        }
    }

    closeStep(): void {
        this.openStepId = null;
    }

    addStep(index: number, type: string): string | null {
        const option = this.getTypeOptions().find(item => item.type === type);
        if (!option || !option.addable || this.detail !== "workflow") {
            return null;
        }
        const step = createNewStep({
            id: generateAlphaNumericId(),
            type,
            transports: this.transports.items
        });
        this.draft.addStep(index, step);
        this.stepsError = null;
        this.typePickerIndex = null;
        this.openStepId = step.id;
        return step.id;
    }

    moveStep(from: number, to: number): void {
        this.draft.moveStep(from, to);
    }

    requestDeleteStep(stepId: string): void {
        const step = this.draft.steps.find(item => item.id === stepId);
        if (!step) {
            return;
        }
        this.pending = {
            vm: deleteStepDialog(step.title),
            action: { kind: "removeStep", stepId }
        };
    }

    getStep(stepId: string): EditorStep | null {
        const step = this.draft.steps.find(item => item.id === stepId);
        return step ?? null;
    }

    updateStep(stepId: string, patch: EditorStepPatch): void {
        this.draft.updateStep(stepId, patch);
        this.clearStepErrors(stepId);
    }

    getStepFieldErrors(stepId: string): StepFieldError[] {
        const entry = this.stepErrors.find(item => item.stepId === stepId);
        return entry ? entry.errors : [];
    }

    isStepReadOnly(stepId: string): boolean {
        const step = this.getStep(stepId);
        return step === null ? false : isStepReadOnly(step, this.stepTypes.items);
    }

    getNamespace(): string | null {
        const row = this.selectedRow;
        return row === null ? null : row.model;
    }

    getTeamOptions(): WorkflowTeamOptions {
        return {
            results: this.teamResults,
            known: this.teamsKnown,
            loading: this.teamsLoading,
            failed: this.teamSearchFailed
        };
    }

    searchTeams(search: string): void {
        this.cancelTeamSearchTimer();
        this.lastTeamSearch = search;
        if (search === "") {
            void this.runTeamSearch(search);
            return;
        }
        this.teamSearchTimer = setTimeout(() => {
            this.teamSearchTimer = null;
            void this.runTeamSearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    async retryTeams(): Promise<void> {
        await this.runTeamSearch(this.lastTeamSearch);
    }

    async confirmDialog(): Promise<void> {
        const pending = this.pending;
        if (pending === null || this.dialogBusy) {
            return;
        }
        const action = pending.action;
        if (action.kind === "switchModel") {
            if (!this.rows.some(item => item.modelId === action.modelId)) {
                // A search replaced the rows while the dialog was open: there is nothing to open.
                this.pending = null;
                return;
            }
            await this.openModel(action.modelId);
            return;
        }
        this.applyRemoveStep(action.stepId);
    }

    cancelDialog(): void {
        if (this.dialogBusy) {
            return;
        }
        this.pending = null;
    }

    getOptions(): WorkflowEditorOptions {
        return {
            stepTypes: this.stepTypes,
            automations: this.automations,
            transports: this.transports,
            aiModels: this.aiModels,
            aiTools: this.aiTools
        };
    }

    dispose(): void {
        this.runToken += 1;
        this.modelToken += 1;
        this.selectToken += 1;
        this.optionsToken += 1;
        this.resolveToken += 1;
        this.teamsToken += 1;
        this.cancelModelSearchTimer();
        this.cancelTeamSearchTimer();
        this.params = null;
        this.status = "loading";
        this.loadError = null;
        this.failedModelId = null;
        this.rows = [];
        this.cursor = null;
        this.hasMore = false;
        this.modelsLoading = false;
        this.loadingMore = false;
        this.modelsFailed = false;
        this.searchDraft = "";
        this.search = "";
        this.selectedRow = null;
        this.detail = "none";
        this.stepTypes = createOptionList("loading");
        this.automations = createOptionList("loading");
        this.transports = createOptionList("loading");
        this.aiModels = createOptionList("loading");
        this.aiTools = createOptionList("loading");
        this.teamsKnown = [];
        this.teamsFailed = false;
        this.draft.reset(null);
        this.nameError = null;
        this.saving = false;
        this.pending = null;
        this.dialogBusy = false;
        this.typePickerIndex = null;
        this.openStepId = null;
        this.stepsError = null;
        this.stepErrors = [];
        this.scrollRequest = null;
        this.teamResults = [];
        this.teamsLoading = false;
        this.teamSearchFailed = false;
        this.lastTeamSearch = "";
    }

    private buildPanel(): ModelPanelVm {
        const params = this.params;
        const selected = this.selectedRow;
        const needle = this.search.trim();
        const noMatch =
            !this.modelsLoading && !this.modelsFailed && this.rows.length === 0 && needle !== "";

        return {
            label: params ? params.app.panelLabel : "",
            showSearch: params ? params.app.appKind === "cms" : false,
            search: this.searchDraft,
            rows: buildModelRowVms({
                rows: this.rows,
                activeModelId: selected ? selected.modelId : null,
                draftOpen: this.draft.isOpen,
                draftIsNew: this.draft.isNew,
                draftDirty: this.draft.isDirty,
                draftStepCount: this.draft.steps.length
            }),
            loading: this.modelsLoading,
            loadingMore: this.loadingMore,
            hasMore: this.hasMore,
            emptyText: noMatch ? `No models match “${needle}”.` : null,
            error: this.modelsFailed ? MODELS_FAILURE_MESSAGE : null
        };
    }

    private buildHeader(): WorkflowHeaderVm | null {
        const params = this.params;
        const row = this.selectedRow;
        if (this.detail !== "workflow" || params === null || row === null) {
            return null;
        }
        const dirty = this.draft.isDirty;

        return {
            name: this.draft.name,
            nameError: this.nameError,
            appliesTo: `Applies to ${row.name} · ${params.app.appliesToLabel}`,
            dirty,
            saving: this.saving,
            canSave: dirty && !this.saving,
            canDelete: !this.draft.isNew
        };
    }

    private buildEmpty(): EmptyWorkflowVm | null {
        const row = this.selectedRow;
        if (this.detail !== "empty" || row === null) {
            return null;
        }
        return {
            title: `${row.name} has no workflow`,
            description: `Add a workflow to require a review before ${row.name} content can be published.`
        };
    }

    private buildOptionsBanner(): OptionsBannerVm | null {
        if (this.status !== "ready") {
            return null;
        }
        const statuses = [
            this.stepTypes.status,
            this.automations.status,
            this.transports.status,
            this.aiModels.status,
            this.aiTools.status
        ];
        if (statuses.includes("failed") || this.teamsFailed || this.teamSearchFailed) {
            return { message: OPTIONS_FAILURE_MESSAGE };
        }
        return null;
    }

    private buildDialog(): WorkflowEditorDialogVm | null {
        if (this.pending === null) {
            return null;
        }
        return { ...this.pending.vm, busy: this.dialogBusy };
    }

    private buildFlow(): WorkflowFlowVm {
        if (this.detail !== "workflow") {
            return { steps: [], stepsError: null };
        }
        const stepTypes = this.stepTypes.items;
        const aiEditable = isAiEditable(stepTypes);
        const count = this.draft.steps.length;
        const steps = this.draft.steps.map((step, index) => {
            const context = this.getStepContext(step, aiEditable);
            const entry = this.stepErrors.find(item => item.stepId === step.id);

            return buildStepCardVm({
                step,
                index,
                count,
                typeLabel: getStepTypeLabel(step.type, stepTypes),
                summary: getStepSummary(step, context),
                warnings: getStepWarnings(step, context),
                errors: entry ? entry.errors : [],
                readOnly: isStepReadOnly(step, stepTypes)
            });
        });

        return { steps, stepsError: this.stepsError };
    }

    private buildTypePicker(): TypePickerVm | null {
        if (this.typePickerIndex === null || this.detail !== "workflow") {
            return null;
        }
        return { index: this.typePickerIndex, options: this.getTypeOptions() };
    }

    private getTypeOptions(): StepTypeOption[] {
        const params = this.params;
        const row = this.selectedRow;
        if (params === null || row === null) {
            return [];
        }
        return getStepTypeOptions({
            stepTypes: this.stepTypes.items,
            automations: this.automations.items,
            namespace: row.model,
            appKind: params.app.appKind
        });
    }

    private getStepContext(step: EditorStep, aiEditable: boolean): StepContext {
        const aiModelsReady = this.aiModels.status === "ready";
        const aiToolsReady = this.aiTools.status === "ready";

        return {
            teams: this.teamsKnown,
            automations: this.automations.items,
            automationsLoaded: this.automations.status === "ready",
            aiModels: aiModelsReady ? this.aiModels.items : null,
            aiTools: aiToolsReady ? this.aiTools.items : null,
            aiEditable,
            baselineStep: this.draft.getBaselineStep(step.id)
        };
    }

    private cancelModelSearchTimer(): void {
        if (this.modelSearchTimer !== null) {
            clearTimeout(this.modelSearchTimer);
            this.modelSearchTimer = null;
        }
    }

    private async applySearch(search: string): Promise<void> {
        this.search = search;
        await this.loadModels(false);
    }

    private async loadModels(more: boolean): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        const token = this.beginModelsLoad(more);
        const after = more ? this.cursor : null;
        try {
            const page = await params.useCases.listModels({
                search: this.search,
                limit: MODEL_PAGE_SIZE,
                after
            });
            if (token === this.modelToken) {
                this.applyModelsPage(page, more);
            }
        } catch (error) {
            if (token === this.modelToken) {
                this.applyModelsFailure(error);
            }
        }
    }

    private beginModelsLoad(more: boolean): number {
        this.modelToken += 1;
        if (more) {
            this.loadingMore = true;
        } else {
            this.modelsLoading = true;
        }
        this.modelsFailed = false;
        return this.modelToken;
    }

    private applyModelsPage(page: WorkflowModelPage, more: boolean): void {
        this.rows = more ? [...this.rows, ...page.rows] : page.rows;
        this.cursor = page.cursor;
        this.hasMore = page.hasMoreItems;
        this.modelsLoading = false;
        this.loadingMore = false;
        if (this.status === "loading") {
            this.status = "ready";
        }
    }

    private applyModelsFailure(error: unknown): void {
        this.modelsLoading = false;
        this.loadingMore = false;
        if (this.status === "loading") {
            this.applyLoadFailure(error);
            return;
        }
        this.modelsFailed = true;
    }

    private applyLoadFailure(error: unknown): void {
        this.status = "failed";
        this.loadError = toMessage(error);
    }

    private async loadOptions(): Promise<void> {
        const token = this.beginOptionsLoad();
        const [types, automations, transports] = await Promise.allSettled([
            this.config.listStepTypes(),
            this.config.listAutomationDefinitions(),
            this.config.listNotificationTransports()
        ]);
        if (token !== this.optionsToken) {
            return;
        }
        this.applyCoreOptions(types, automations, transports);

        // The AI lists exist only with the AI editor (R275); without it they are not requested.
        if (!isAiEditable(this.stepTypes.items)) {
            this.applyAiNotRequested();
            return;
        }
        const [models, tools] = await Promise.allSettled([
            this.config.listAiModels(),
            this.config.listAiTools()
        ]);
        if (token !== this.optionsToken) {
            return;
        }
        this.applyAiOptions(models, tools);
    }

    private beginOptionsLoad(): number {
        this.optionsToken += 1;
        this.stepTypes = createOptionList("loading");
        this.automations = createOptionList("loading");
        this.transports = createOptionList("loading");
        this.aiModels = createOptionList("loading");
        this.aiTools = createOptionList("loading");
        return this.optionsToken;
    }

    private applyCoreOptions(
        types: PromiseSettledResult<EditorStepType[]>,
        automations: PromiseSettledResult<AutomationDefinition[]>,
        transports: PromiseSettledResult<NotificationTransport[]>
    ): void {
        this.stepTypes = toOptionList(types);
        this.automations = toOptionList(automations);
        this.transports = toOptionList(transports);
    }

    private applyAiNotRequested(): void {
        this.aiModels = createOptionList("ready");
        this.aiTools = createOptionList("ready");
    }

    private applyAiOptions(
        models: PromiseSettledResult<AiModel[]>,
        tools: PromiseSettledResult<AiTool[]>
    ): void {
        this.aiModels = toOptionList(models);
        this.aiTools = toOptionList(tools);
    }

    private async openModel(modelId: string): Promise<void> {
        const params = this.params;
        const row = this.rows.find(item => item.modelId === modelId);
        if (params === null || !row) {
            return;
        }
        const token = this.beginOpen(row);
        if (row.workflow === null) {
            return;
        }
        try {
            const workflow = await params.useCases.getWorkflow(row.workflow.id);
            if (token !== this.selectToken) {
                return;
            }
            this.applyLoadedWorkflow(workflow, row.modelId);
        } catch (error) {
            if (token === this.selectToken) {
                this.applyOpenFailure(error, row.modelId);
            }
            return;
        }
        await this.resolveTeams();
    }

    private beginOpen(row: WorkflowModelRow): number {
        this.selectToken += 1;
        this.resolveToken += 1;
        this.selectedRow = row;
        this.teamsFailed = false;
        this.draft.reset(null);
        this.nameError = null;
        this.pending = null;
        this.typePickerIndex = null;
        this.openStepId = null;
        this.stepsError = null;
        this.stepErrors = [];
        this.scrollRequest = null;
        this.detail = row.workflow === null ? "empty" : "loading";
        return this.selectToken;
    }

    private applyLoadedWorkflow(workflow: EditorWorkflow, modelId: string): void {
        this.draft.reset(workflow);
        this.detail = "workflow";
        this.bindWorkflow(modelId, { id: workflow.id, name: workflow.name });
    }

    private applyOpenFailure(error: unknown, modelId: string): void {
        if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.NotFound) {
            // The bound workflow was deleted since the list was read: the model has none.
            this.bindWorkflow(modelId, null);
            this.detail = "empty";
            return;
        }
        this.failedModelId = modelId;
        this.applyLoadFailure(error);
    }

    // Updates the row of a model (and the open row) after its bound workflow changed.
    private bindWorkflow(modelId: string, workflow: WorkflowModelRow["workflow"]): void {
        this.rows = this.rows.map(row => {
            return row.modelId === modelId ? { ...row, workflow } : row;
        });
        const selected = this.selectedRow;
        if (selected !== null && selected.modelId === modelId) {
            this.selectedRow = { ...selected, workflow };
        }
    }

    private async resolveTeams(): Promise<void> {
        const wanted = collectTeamIds(this.draft.steps, this.automations.items);
        const missing = wanted.filter(id => !this.teamsKnown.some(team => team.id === id));
        if (missing.length === 0) {
            return;
        }
        this.resolveToken += 1;
        const token = this.resolveToken;
        // The server refuses more than 200 ids (R268); the rest keep the Unknown item name.
        const ids = missing.slice(0, TEAM_IDS_LIMIT);
        try {
            const result = await this.config.listTeams({ search: null, ids, limit: null });
            if (token === this.resolveToken) {
                this.applyResolvedTeams(result.teams);
            }
        } catch {
            if (token === this.resolveToken) {
                this.teamsFailed = true;
            }
        }
    }

    private applyResolvedTeams(teams: WorkflowTeamSummary[]): void {
        this.teamsFailed = false;
        this.teamsKnown = mergeTeams(this.teamsKnown, teams);
    }

    private cancelTeamSearchTimer(): void {
        if (this.teamSearchTimer !== null) {
            clearTimeout(this.teamSearchTimer);
            this.teamSearchTimer = null;
        }
    }

    private applyRemoveStep(stepId: string): void {
        this.draft.removeStep(stepId);
        this.clearStepErrors(stepId);
        if (this.openStepId === stepId) {
            this.openStepId = null;
        }
        this.pending = null;
    }

    private clearStepErrors(stepId: string): void {
        this.stepErrors = this.stepErrors.filter(item => item.stepId !== stepId);
    }

    private async runTeamSearch(search: string): Promise<void> {
        this.teamsToken += 1;
        const token = this.teamsToken;
        this.teamsLoading = true;
        this.teamSearchFailed = false;
        const query = search === "" ? null : search;
        try {
            const result = await this.config.listTeams({
                search: query,
                ids: null,
                limit: TEAM_SEARCH_LIMIT
            });
            if (token === this.teamsToken) {
                this.applyTeamResults(result.teams);
            }
        } catch {
            if (token === this.teamsToken) {
                this.applyTeamSearchFailure();
            }
        }
    }

    private applyTeamResults(teams: WorkflowTeamSummary[]): void {
        this.teamResults = teams;
        this.teamsKnown = mergeTeams(this.teamsKnown, teams);
        this.teamsLoading = false;
    }

    private applyTeamSearchFailure(): void {
        this.teamsLoading = false;
        this.teamSearchFailed = true;
    }
}

export const WorkflowEditorPresenter = Abstraction.createImplementation({
    implementation: WorkflowEditorPresenterImpl,
    dependencies: [WorkflowConfigUseCases, IdentityContext]
});
