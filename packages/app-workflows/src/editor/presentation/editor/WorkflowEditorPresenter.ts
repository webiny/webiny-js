import { makeAutoObservable } from "mobx";
import { validateWorkflowDraft } from "~/editor/model/validateWorkflowDraft.js";
import type { WorkflowDraftErrors } from "~/editor/model/StepFieldError.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import type { DialogReviewVm } from "./abstractions.js";
import type { SaveBannerVm } from "./abstractions.js";
import { blockedDeleteDialog } from "./dialogs/blockedDeleteDialog.js";
import { conflictDialog } from "./dialogs/conflictDialog.js";
import { deleteWorkflowDialog } from "./dialogs/deleteWorkflowDialog.js";
import { deletedDialog } from "./dialogs/deletedDialog.js";
import { reloadWorkflowDialog } from "./dialogs/reloadWorkflowDialog.js";
import { duplicateBannerMessage } from "./duplicateBannerMessage.js";
import { mapSaveError } from "./mapSaveError.js";
import type { SaveFailure } from "./mapSaveError.js";
import type { ValidationFailure } from "./mapSaveError.js";
import { readBlockedDeleteData } from "./readBlockedDeleteData.js";
import type { SaveBannerState } from "./SaveBannerState.js";
import { toMessageBanner } from "./toMessageBanner.js";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import { isAiEditable } from "~/editor/model/isAiEditable.js";
import { isReviewAvailable } from "~/editor/model/isReviewAvailable.js";
import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
import { WorkflowDraft } from "~/editor/model/WorkflowDraft.js";
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
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
import type { ReferencesStatus } from "./abstractions.js";
import { addFoundTeams } from "./addFoundTeams.js";
import { addFoundUsers } from "./addFoundUsers.js";
import { getMemberKey } from "./getMemberKey.js";
import { USER_SEARCH_LIMIT } from "./constants.js";
import type { DrawerInspectParams } from "./abstractions.js";
import type { FolderOptionsState } from "./abstractions.js";
import type { UserOptionsState } from "./abstractions.js";
import { buildInspectionNames } from "./buildInspectionNames.js";
import { chunkIds } from "./chunkIds.js";
import { collectInspectionLookupIds } from "./collectInspectionLookupIds.js";
import { collectRuleReferenceIds } from "./collectRuleReferenceIds.js";
import { findUnresolvedReferenceIds } from "./findUnresolvedReferenceIds.js";
import { partitionSettled } from "./partitionSettled.js";
import { pruneRuleReferences } from "./pruneRuleReferences.js";
import { resolveRuleReferences } from "./resolveRuleReferences.js";
import type { ResolveRuleReferencesParams } from "./resolveRuleReferences.js";
import { USER_IDS_LIMIT } from "./constants.js";
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
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
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
import { getRuleErrorsFromSave } from "./getRuleErrorsFromSave.js";
import { getStepRuleIds } from "~/editor/model/getStepRuleIds.js";
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
    private saveBanner: SaveBannerState | null = null;
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
    // The users, rule teams and folders the rules reference, by id (R298).
    private references: RuleReferences = createEmptyRuleReferences();
    private referencesFailed = false;
    private referencesLoading = false;
    private referencesToken = 0;
    // The app's folder list of the open model, loaded once; `folderLoad` is the in-flight or settled load.
    private folders: AppFolder[] = [];
    private foldersLoading = false;
    private foldersFailed = false;
    private foldersToken = 0;
    private folderLoad: Promise<AppFolder[] | null> | null = null;
    // The user search of the requester pickers, and the member search of the rule target picker.
    private userResults: WorkflowUserSummary[] = [];
    private usersLoading = false;
    private usersFailed = false;
    private lastUserSearch = "";
    private usersToken = 0;
    private userSearchTimer: ReturnType<typeof setTimeout> | null = null;
    private memberResults: WorkflowUserSummary[] = [];
    // The team set the member results belong to (`getMemberKey`).
    private memberKey = "";
    private membersLoading = false;
    private membersFailed = false;
    private lastMemberSearch = "";
    private membersToken = 0;
    private memberSearchTimer: ReturnType<typeof setTimeout> | null = null;
    // Generations: every init, dispose, search and open starts a new one and an older response is ignored.
    private runToken = 0;
    private modelToken = 0;
    private selectToken = 0;
    private optionsToken = 0;
    private resolveToken = 0;
    private modelSearchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private listStepTypesUseCase: ListStepTypesUseCase.Interface,
        private listAutomationDefinitionsUseCase: ListAutomationDefinitionsUseCase.Interface,
        private listNotificationTransportsUseCase: ListNotificationTransportsUseCase.Interface,
        private listAiModelsUseCase: ListAiModelsUseCase.Interface,
        private listAiToolsUseCase: ListAiToolsUseCase.Interface,
        private listWorkflowTeamsUseCase: ListWorkflowTeamsUseCase.Interface,
        private listWorkflowUsersUseCase: ListWorkflowUsersUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            WorkflowEditorPresenterImpl,
            | "listStepTypesUseCase"
            | "listAutomationDefinitionsUseCase"
            | "listNotificationTransportsUseCase"
            | "listAiModelsUseCase"
            | "listAiToolsUseCase"
            | "listWorkflowTeamsUseCase"
            | "listWorkflowUsersUseCase"
            | "identityContext"
            | "toasts"
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
            | "saveBanner"
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
            | "references"
            | "referencesToken"
            | "folders"
            | "foldersToken"
            | "folderLoad"
            | "userResults"
            | "lastUserSearch"
            | "usersToken"
            | "userSearchTimer"
            | "memberResults"
            | "lastMemberSearch"
            | "membersToken"
            | "memberSearchTimer"
        >(this, {
            listStepTypesUseCase: false,
            listAutomationDefinitionsUseCase: false,
            listNotificationTransportsUseCase: false,
            listAiModelsUseCase: false,
            listAiToolsUseCase: false,
            listWorkflowTeamsUseCase: false,
            listWorkflowUsersUseCase: false,
            identityContext: false,
            toasts: false,
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
            saveBanner: observableRef,
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
            modelSearchTimer: false,
            references: observableRef,
            referencesToken: false,
            folders: observableRef,
            foldersToken: false,
            folderLoad: false,
            userResults: observableRef,
            lastUserSearch: false,
            usersToken: false,
            userSearchTimer: false,
            memberResults: observableRef,
            lastMemberSearch: false,
            membersToken: false,
            memberSearchTimer: false
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
            saveBanner: this.buildSaveBanner(),
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
        await this.reloadReferences();
        // The banner also covers a failed team search of the drawer's picker (R284).
        if (this.teamSearchFailed) {
            await this.retryTeams();
        }
    }

    async retryModels(): Promise<void> {
        await this.loadModels(false);
    }

    async save(): Promise<void> {
        if (this.saving || this.dialogBusy || !this.draft.isDirty || this.detail !== "workflow") {
            return;
        }
        this.saveBanner = null;
        const errors = validateWorkflowDraft({
            name: this.draft.name,
            steps: this.draft.steps,
            automations: this.automations.items,
            aiEditable: isAiEditable(this.stepTypes.items),
            references: this.references,
            reviewAvailable: this.isReviewAvailable()
        });
        const invalid =
            errors.name !== null || errors.steps !== null || errors.stepErrors.length > 0;
        this.applyClientErrors(errors);
        if (invalid) {
            const message =
                errors.stepErrors.length > 0
                    ? "Fix the highlighted steps before saving."
                    : "Fix the highlighted fields before saving.";
            this.toasts.error(message);
            return;
        }
        await this.persist(this.draft.savedOn, "Workflow saved");
    }

    async retrySave(): Promise<void> {
        this.toasts.info("Retrying…");
        await this.save();
    }

    dismissBanner(): void {
        this.saveBanner = null;
    }

    reloadDuplicate(): void {
        const banner = this.saveBanner;
        const row = this.selectedRow;
        if (
            banner === null ||
            banner.kind !== "duplicate" ||
            row === null ||
            this.pending !== null
        ) {
            return;
        }
        this.pending = {
            vm: reloadWorkflowDialog({ modelName: row.name, workflowName: banner.workflowName }),
            action: { kind: "reloadDuplicate", workflowId: banner.workflowId }
        };
    }

    requestDelete(): void {
        const row = this.selectedRow;
        if (
            row === null ||
            !this.draft.isOpen ||
            this.draft.isNew ||
            this.saving ||
            this.dialogBusy ||
            this.pending !== null
        ) {
            return;
        }
        this.pending = {
            vm: deleteWorkflowDialog({ workflowName: this.draft.name, modelName: row.name }),
            action: { kind: "deleteWorkflow" }
        };
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
        // A model switch while a store call is in flight would drop its answer.
        if (this.saving) {
            return;
        }
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
        // An edit during a store call would be discarded by its answer.
        if (this.saving) {
            return;
        }
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
        if (!option || !option.addable || this.detail !== "workflow" || this.saving) {
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
        this.loadFoldersForPeopleSteps();
        return step.id;
    }

    moveStep(from: number, to: number): void {
        if (this.saving) {
            return;
        }
        this.draft.moveStep(from, to);
    }

    requestDeleteStep(stepId: string): void {
        const step = this.draft.steps.find(item => item.id === stepId);
        if (!step || this.saving) {
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
        if (this.saving) {
            return;
        }
        this.draft.updateStep(stepId, patch);
        this.clearStepErrors(stepId);
        void this.resolveReferences();
    }

    getStepFieldErrors(stepId: string): StepFieldError[] {
        const entry = this.stepErrors.find(item => item.stepId === stepId);
        return entry ? entry.errors : [];
    }

    getStepWarnings(stepId: string): StepWarningLine[] {
        const step = this.getStep(stepId);
        if (step === null) {
            return [];
        }
        const context = this.getStepContext(step, isAiEditable(this.stepTypes.items));
        return getStepWarnings(step, context);
    }

    isStepReadOnly(stepId: string): boolean {
        const step = this.getStep(stepId);
        return step === null ? false : isStepReadOnly(step, this.stepTypes.items);
    }

    isSaving(): boolean {
        return this.saving;
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

    getReferences(): RuleReferences {
        return this.references;
    }

    getReferencesStatus(): ReferencesStatus {
        return { loading: this.referencesLoading, failed: this.referencesFailed };
    }

    retryReferences(): void {
        void this.reloadReferences();
    }

    getUserOptions(): UserOptionsState {
        return {
            items: this.userResults,
            selected: this.getKnownUsers(),
            loading: this.usersLoading,
            failed: this.usersFailed
        };
    }

    searchUsers(search: string): void {
        this.cancelUserSearchTimer();
        this.lastUserSearch = search;
        if (search === "") {
            void this.runUserSearch(search);
            return;
        }
        this.userSearchTimer = setTimeout(() => {
            this.userSearchTimer = null;
            void this.runUserSearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    retryUsers(): void {
        void this.runUserSearch(this.lastUserSearch);
    }

    getTargetMemberOptions(stepTeamIds: string[]): UserOptionsState {
        const current = this.memberKey === getMemberKey(stepTeamIds);
        return {
            items: current ? this.memberResults : [],
            selected: this.getKnownUsers(),
            loading: current && this.membersLoading,
            failed: current && this.membersFailed
        };
    }

    searchTargetMembers(stepTeamIds: string[], search: string): void {
        this.cancelMemberSearchTimer();
        this.lastMemberSearch = search;
        if (search === "") {
            void this.runMemberSearch(stepTeamIds, search);
            return;
        }
        this.memberSearchTimer = setTimeout(() => {
            this.memberSearchTimer = null;
            void this.runMemberSearch(stepTeamIds, search);
        }, SEARCH_DEBOUNCE_MS);
    }

    retryTargetMembers(stepTeamIds: string[]): void {
        void this.runMemberSearch(stepTeamIds, this.lastMemberSearch);
    }

    getFolderOptions(): FolderOptionsState {
        return {
            items: this.folders,
            loading: this.foldersLoading,
            failed: this.foldersFailed
        };
    }

    getFolderType(): string {
        const params = this.params;
        if (params === null) {
            return "";
        }
        const modelId = this.getModelId();
        return params.app.getFolderType(modelId);
    }

    getModelId(): string | null {
        const row = this.selectedRow;
        return row === null ? null : row.modelId;
    }

    async inspectRouting(params: DrawerInspectParams): Promise<RoutingInspection> {
        const init = this.params;
        if (init === null) {
            throw new Error("The editor is not open.");
        }
        const modelId = this.getModelId();
        return init.useCases.inspectRouting({
            stepConfig: params.stepConfig,
            requesterId: params.requesterId,
            folderId: params.folderId,
            modelId
        });
    }

    async resolveInspectionNames(inspection: RoutingInspection): Promise<InspectionNames> {
        const ids = collectInspectionLookupIds(inspection, this.references);
        const userChunks = chunkIds(ids.userIds, USER_IDS_LIMIT);
        const userCalls = userChunks.map(chunk => {
            // A synchronous throw of the call becomes a rejection, which allSettled catches.
            return Promise.resolve().then(() => {
                return this.listWorkflowUsersUseCase.execute({
                    search: null,
                    ids: chunk,
                    teamIds: null,
                    limit: null
                });
            });
        });
        const teamChunks = chunkIds(ids.teamIds, TEAM_IDS_LIMIT);
        const teamCalls = teamChunks.map(chunk => {
            return Promise.resolve().then(() => {
                return this.listWorkflowTeamsUseCase.execute({
                    search: null,
                    ids: chunk,
                    limit: null
                });
            });
        });

        // A rejected lookup leaves its ids unnamed; the test itself does not fail (R301).
        const settledUsers = Promise.allSettled(userCalls);
        const settledTeams = Promise.allSettled(teamCalls);
        const [userAnswers, teamAnswers] = await Promise.all([settledUsers, settledTeams]);
        const users = partitionSettled(userAnswers);
        const teams = partitionSettled(teamAnswers);
        const foundUsers = users.values.flatMap(list => list.users);
        const foundTeams = teams.values.flatMap(list => list.teams);

        return buildInspectionNames({
            references: this.references,
            users: foundUsers,
            teams: foundTeams
        });
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
        if (action.kind === "removeStep") {
            this.applyRemoveStep(action.stepId);
            return;
        }
        if (action.kind === "reload") {
            await this.loadWorkflowInto(this.draft.id, "Loaded the latest version");
            return;
        }
        if (action.kind === "reloadDuplicate") {
            await this.loadWorkflowInto(action.workflowId, null);
            return;
        }
        if (action.kind === "saveAsNew") {
            this.draft.detachBaseline();
            this.pending = null;
            await this.persist(null, "Saved as a new workflow");
            return;
        }
        if (action.kind === "deleteWorkflow") {
            await this.deleteCurrent();
            return;
        }
        // The blocked delete dialog has no primary button.
        this.pending = null;
    }

    cancelDialog(): void {
        // A busy dialog is mid-action (a reload or a delete): its buttons do nothing.
        if (this.dialogBusy) {
            return;
        }
        const pending = this.pending;
        // The deleted dialog's secondary button discards the draft (QBZ-94). The workflow is gone
        // on the server, so the review UI's cached list is stale too (R277).
        if (pending !== null && pending.action.kind === "saveAsNew") {
            const params = this.params;
            this.applyDiscardedDraft();
            if (params !== null) {
                params.reviewUseCases.invalidateWorkflows();
            }
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
        this.referencesToken += 1;
        this.usersToken += 1;
        this.membersToken += 1;
        this.foldersToken += 1;
        this.cancelUserSearchTimer();
        this.cancelMemberSearchTimer();
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
        this.saveBanner = null;
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
        this.references = createEmptyRuleReferences();
        this.referencesFailed = false;
        this.referencesLoading = false;
        this.folders = [];
        this.foldersLoading = false;
        this.foldersFailed = false;
        this.folderLoad = null;
        this.userResults = [];
        this.usersLoading = false;
        this.usersFailed = false;
        this.lastUserSearch = "";
        this.memberResults = [];
        this.memberKey = "";
        this.membersLoading = false;
        this.membersFailed = false;
        this.lastMemberSearch = "";
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
            canDelete: !this.draft.isNew && !this.saving && !this.dialogBusy
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
        const failed =
            statuses.includes("failed") ||
            this.teamsFailed ||
            this.teamSearchFailed ||
            this.referencesFailed ||
            this.foldersFailed;
        if (failed) {
            return { message: OPTIONS_FAILURE_MESSAGE };
        }
        return null;
    }

    private buildSaveBanner(): SaveBannerVm | null {
        const banner = this.saveBanner;
        if (banner === null) {
            return null;
        }
        if (banner.kind === "transport") {
            return {
                kind: "transport",
                title: "Could not save the workflow",
                message: "The server did not respond, so nothing was saved. Your changes are kept.",
                canReload: false,
                canRetry: true,
                dismissible: true
            };
        }
        return {
            kind: banner.kind,
            title: null,
            message: banner.message,
            canReload: banner.kind === "duplicate",
            canRetry: false,
            dismissible: false
        };
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
                ruleIds: getStepRuleIds(step),
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
            baselineStep: this.draft.getBaselineStep(step.id),
            references: this.references,
            reviewAvailable: this.isReviewAvailable()
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
            this.listStepTypesUseCase.execute(),
            this.listAutomationDefinitionsUseCase.execute(),
            this.listNotificationTransportsUseCase.execute()
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
            this.listAiModelsUseCase.execute(),
            this.listAiToolsUseCase.execute()
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
        this.loadFoldersForPeopleSteps();
        await this.resolveTeams();
        await this.resolveReferences();
    }

    private beginOpen(row: WorkflowModelRow): number {
        this.selectToken += 1;
        this.resolveToken += 1;
        this.referencesToken += 1;
        this.foldersToken += 1;
        this.references = createEmptyRuleReferences();
        this.referencesFailed = false;
        this.referencesLoading = false;
        this.folders = [];
        this.foldersLoading = false;
        this.foldersFailed = false;
        this.folderLoad = null;
        this.selectedRow = row;
        this.teamsFailed = false;
        this.draft.reset(null);
        this.nameError = null;
        this.pending = null;
        this.dialogBusy = false;
        this.saving = false;
        this.saveBanner = null;
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
        // A People step of an unavailable review row is not resolved: teams are off (R290).
        let steps = this.draft.steps;
        if (!this.isReviewAvailable()) {
            steps = steps.filter(step => step.type !== StepTypeId.Review);
        }
        const wanted = collectTeamIds(steps, this.automations.items);
        const missing = wanted.filter(id => !this.teamsKnown.some(team => team.id === id));
        if (missing.length === 0) {
            return;
        }
        this.resolveToken += 1;
        const token = this.resolveToken;
        // The server refuses more than 200 ids (R268); the rest keep the Unknown item name.
        const ids = missing.slice(0, TEAM_IDS_LIMIT);
        try {
            const result = await this.listWorkflowTeamsUseCase.execute({
                search: null,
                ids,
                limit: null
            });
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
        this.references = addFoundTeams(this.references, teams);
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

    private async persist(savedOn: string | null, successTitle: string): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        const token = this.beginSave();
        let workflow: EditorWorkflow;
        // Only the store call maps to a save failure.
        try {
            workflow = await params.useCases.storeWorkflow({
                data: this.draft.toInput(),
                savedOn
            });
        } catch (error) {
            try {
                if (token !== this.selectToken) {
                    return;
                }
                const failure = mapSaveError(error);
                await this.handleSaveFailure(failure, token);
            } finally {
                // `saving` stays true until the failure is fully resolved, so no save overlaps it.
                if (token === this.selectToken) {
                    this.saving = false;
                }
            }
            return;
        }
        // The server stored it, so the review UI's cached list is stale whatever the editor
        // shows now (R277, Review Focus 8).
        try {
            params.reviewUseCases.invalidateWorkflows();
            if (token === this.selectToken) {
                this.applySaved(workflow);
                this.toasts.success(successTitle);
            }
        } finally {
            // Whatever throws above, the editor must never stay locked by a stuck `saving`.
            if (token === this.selectToken) {
                this.saving = false;
            }
        }
    }

    private beginSave(): number {
        this.saving = true;
        this.saveBanner = null;
        this.pending = null;
        return this.selectToken;
    }

    private applySaved(workflow: EditorWorkflow): void {
        this.draft.reset(workflow);
        const row = this.selectedRow;
        if (row !== null) {
            this.bindWorkflow(row.modelId, { id: workflow.id, name: workflow.name });
        }
        this.saving = false;
        this.saveBanner = null;
        this.pending = null;
        this.nameError = null;
        this.stepsError = null;
        this.stepErrors = [];
        const wanted = collectRuleReferenceIds(
            this.draft.steps,
            this.isReviewAvailable(),
            this.automations.items
        );
        this.references = pruneRuleReferences(this.references, wanted);
        void this.resolveReferences();
    }

    private async handleSaveFailure(failure: SaveFailure, token: number): Promise<void> {
        if (failure.kind === "conflict") {
            this.pending = {
                vm: conflictDialog({
                    savedByName: failure.savedByName,
                    workflowName: this.draft.name
                }),
                action: { kind: "reload" }
            };
            return;
        }
        if (failure.kind === "notFound") {
            const row = this.selectedRow;
            this.pending = {
                vm: deletedDialog({
                    workflowName: this.draft.name,
                    modelName: row === null ? "" : row.name
                }),
                action: { kind: "saveAsNew" }
            };
            return;
        }
        if (failure.kind === "transport") {
            this.saveBanner = { kind: "transport" };
            return;
        }
        if (failure.kind === "server") {
            this.saveBanner = toMessageBanner(failure.message);
            return;
        }
        await this.handleValidationFailure(failure, token);
    }

    private async handleValidationFailure(
        failure: ValidationFailure,
        token: number
    ): Promise<void> {
        const stepId = failure.stepId;
        if (stepId !== null && this.draft.steps.some(step => step.id === stepId)) {
            this.applyServerStepError(stepId, failure);
            this.toasts.error("Could not save. Check the highlighted step.");
            return;
        }
        if (failure.workflowId !== null) {
            const banner = await this.resolveDuplicateBanner(failure, token);
            if (token === this.selectToken) {
                this.saveBanner = banner;
            }
            return;
        }
        if (failure.field === "name") {
            this.nameError = failure.message;
        }
        if (failure.field === "steps") {
            this.stepsError = failure.message;
        }
        this.saveBanner = toMessageBanner(failure.message);
    }

    private async resolveDuplicateBanner(
        failure: ValidationFailure,
        token: number
    ): Promise<SaveBannerState> {
        const params = this.params;
        const row = this.selectedRow;
        const workflowId = failure.workflowId;
        if (params === null || row === null || workflowId === null) {
            return toMessageBanner(failure.message);
        }
        let name: string | null = null;
        try {
            const other = await params.useCases.getWorkflow(workflowId);
            name = other.name;
        } catch {
            // Fall back to the name the model row already carries.
            name = row.workflow === null ? null : row.workflow.name;
        }
        if (name === null || token !== this.selectToken) {
            return toMessageBanner(failure.message);
        }
        const message = duplicateBannerMessage({
            appKind: params.app.appKind,
            modelName: row.name,
            workflowName: name
        });
        return { kind: "duplicate", message, workflowId, workflowName: name };
    }

    private applyClientErrors(errors: WorkflowDraftErrors): void {
        this.nameError = errors.name;
        this.stepsError = errors.steps;
        this.stepErrors = errors.stepErrors;
        if (errors.stepErrors.length > 0) {
            this.requestScroll(errors.stepErrors[0].stepId);
        }
    }

    private applyServerStepError(stepId: string, failure: ValidationFailure): void {
        this.nameError = null;
        this.stepsError = null;
        const step = this.draft.steps.find(item => item.id === stepId) ?? null;
        const errors = getRuleErrorsFromSave(failure, step);
        this.stepErrors = [{ stepId, errors }];
        this.requestScroll(stepId);
    }

    private requestScroll(stepId: string): void {
        const nonce = this.scrollRequest === null ? 1 : this.scrollRequest.nonce + 1;
        this.scrollRequest = { stepId, nonce };
    }

    private async loadWorkflowInto(id: string, toastTitle: string | null): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        this.dialogBusy = true;
        const token = this.selectToken;
        try {
            const workflow = await params.useCases.getWorkflow(id);
            if (token !== this.selectToken) {
                return;
            }
            this.applyReloaded(workflow);
            if (toastTitle !== null) {
                this.toasts.success(toastTitle);
            }
        } catch {
            // The dialog stays open so the admin can try again or keep editing.
            if (token === this.selectToken) {
                this.dialogBusy = false;
                this.toasts.error("Could not load the workflow.");
            }
            return;
        }
        this.loadFoldersForPeopleSteps();
        await this.resolveTeams();
        await this.resolveReferences();
    }

    private applyReloaded(workflow: EditorWorkflow): void {
        this.draft.reset(workflow);
        this.detail = "workflow";
        const row = this.selectedRow;
        if (row !== null) {
            this.bindWorkflow(row.modelId, { id: workflow.id, name: workflow.name });
        }
        this.clearEditingState();
    }

    private applyDiscardedDraft(): void {
        const row = this.selectedRow;
        this.draft.reset(null);
        if (row !== null) {
            this.bindWorkflow(row.modelId, null);
        }
        this.detail = "empty";
        this.clearEditingState();
    }

    // A reload replaces the steps and a discard closes the draft, so the drawer closes too; a
    // successful save keeps the same step ids and leaves it open (R284).
    private clearEditingState(): void {
        this.pending = null;
        this.dialogBusy = false;
        this.saving = false;
        this.saveBanner = null;
        this.nameError = null;
        this.stepsError = null;
        this.stepErrors = [];
        this.scrollRequest = null;
        this.typePickerIndex = null;
        this.openStepId = null;
    }

    private async deleteCurrent(): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        this.dialogBusy = true;
        const token = this.selectToken;
        try {
            await params.useCases.deleteWorkflow(this.draft.id);
            params.reviewUseCases.invalidateWorkflows();
            if (token !== this.selectToken) {
                return;
            }
            this.applyDiscardedDraft();
            this.toasts.success("Workflow deleted");
        } catch (error) {
            if (token !== this.selectToken) {
                return;
            }
            this.handleDeleteFailure(error);
        }
    }

    private handleDeleteFailure(error: unknown): void {
        const params = this.params;
        this.dialogBusy = false;
        if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.NotFound) {
            // Already gone: the same outcome as a delete.
            this.applyDiscardedDraft();
            if (params !== null) {
                params.reviewUseCases.invalidateWorkflows();
            }
            this.toasts.success("Workflow deleted");
            return;
        }
        if (
            error instanceof GraphQLOperationError &&
            error.code === WorkflowErrorCode.HasActiveReviews &&
            params !== null
        ) {
            this.showBlockedDelete(error, params);
            return;
        }
        this.pending = null;
        if (error instanceof GraphQLOperationError) {
            this.toasts.error(error.message);
            return;
        }
        this.toasts.error("The server did not respond, so nothing was changed. Try again.");
    }

    private showBlockedDelete(
        error: GraphQLOperationError,
        params: WorkflowEditorInitParams
    ): void {
        const blocked = readBlockedDeleteData(error.data);
        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        const reviews: DialogReviewVm[] = blocked.reviews.slice(0, 5).map(review => {
            return {
                reviewId: review.reviewId,
                title: review.title,
                position: `Step ${review.stepPosition} of ${review.stepCount} · ${review.stepName}`,
                url: params.app.contentAdapter.getContentUrl({
                    namespace: review.model,
                    targetId: review.targetId,
                    targetRevisionId: review.targetRevisionId,
                    contentTypeId: null
                })
            };
        });
        this.pending = {
            vm: blockedDeleteDialog({
                workflowName: this.draft.name,
                count: blocked.count,
                reviews,
                canReassign: permissions.reassign
            }),
            action: { kind: "close" }
        };
    }

    private isReviewAvailable(): boolean {
        return isReviewAvailable(this.stepTypes.items);
    }

    // Loads the folder list for a workflow that has a People step; the load is shared and cached.
    private loadFoldersForPeopleSteps(): void {
        if (this.draft.steps.some(step => step.type === StepTypeId.Review)) {
            void this.loadFolders();
        }
    }

    // The folder list of the open model, loaded once; null when it is not available or failed.
    private loadFolders(): Promise<AppFolder[] | null> {
        const params = this.params;
        const row = this.selectedRow;
        if (params === null || row === null || !this.isReviewAvailable()) {
            return Promise.resolve(null);
        }
        if (this.folderLoad === null) {
            this.folderLoad = this.fetchFolders(params, row.modelId);
        }
        return this.folderLoad;
    }

    private async fetchFolders(
        params: WorkflowEditorInitParams,
        modelId: string
    ): Promise<AppFolder[] | null> {
        const token = this.foldersToken;
        this.foldersLoading = true;
        this.foldersFailed = false;
        try {
            const folders = await params.app.listFolders(modelId);
            if (token !== this.foldersToken) {
                return null;
            }
            this.applyFolders(folders);
            return folders;
        } catch {
            if (token === this.foldersToken) {
                this.applyFoldersFailure();
            }
            return null;
        }
    }

    private applyFolders(folders: AppFolder[]): void {
        this.folders = folders;
        this.foldersLoading = false;
        this.foldersFailed = false;
    }

    private applyFoldersFailure(): void {
        this.foldersLoading = false;
        this.foldersFailed = true;
        // The next attempt loads the list again.
        this.folderLoad = null;
    }

    private async reloadReferences(): Promise<void> {
        if (this.foldersFailed) {
            await this.loadFolders();
        }
        await this.resolveReferences();
    }

    private async resolveReferences(): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        this.references = addFoundTeams(this.references, this.teamsKnown);
        const wanted = collectRuleReferenceIds(
            this.draft.steps,
            this.isReviewAvailable(),
            this.automations.items
        );
        const missing = findUnresolvedReferenceIds(wanted, this.references);
        const nothing =
            missing.userIds.length === 0 &&
            missing.teamIds.length === 0 &&
            missing.folders.length === 0;
        if (nothing) {
            this.referencesFailed = false;
            this.referencesLoading = false;
            return;
        }

        this.referencesToken += 1;
        const token = this.referencesToken;
        this.referencesLoading = true;
        const userChunks = chunkIds(missing.userIds, USER_IDS_LIMIT);
        const userCalls = userChunks.map(ids => {
            // A synchronous throw of the call becomes a rejection, which allSettled catches.
            return Promise.resolve().then(() => {
                return this.listWorkflowUsersUseCase.execute({
                    search: null,
                    ids,
                    teamIds: null,
                    limit: null
                });
            });
        });
        const teamChunks = chunkIds(missing.teamIds, TEAM_IDS_LIMIT);
        const teamCalls = teamChunks.map(ids => {
            return Promise.resolve().then(() => {
                return this.listWorkflowTeamsUseCase.execute({ search: null, ids, limit: null });
            });
        });
        const needsFolders = missing.folders.length > 0;
        // A failed list load is retried only by Try again, not by every run (it would loop on edits).
        let folderList = Promise.resolve<AppFolder[] | null>(this.folders);
        if (needsFolders && !this.foldersFailed) {
            folderList = this.loadFolders();
        }
        if (needsFolders && this.foldersFailed) {
            folderList = Promise.resolve(null);
        }

        const settledUsers = Promise.allSettled(userCalls);
        const settledTeams = Promise.allSettled(teamCalls);
        const [userAnswers, teamAnswers, listed] = await Promise.all([
            settledUsers,
            settledTeams,
            folderList
        ]);
        if (token !== this.referencesToken) {
            return;
        }

        const listedFolders = listed ?? [];
        const unlisted = missing.folders.filter(folder => {
            return !listedFolders.some(item => item.id === folder.id);
        });
        // Without the list nothing can be told apart, so no existence check is sent.
        let existenceAnswers: PromiseSettledResult<boolean>[] = [];
        if (listed !== null) {
            const existenceCalls = unlisted.map(folder => {
                return Promise.resolve().then(() => {
                    return params.useCases.folderExists({ id: folder.id, type: folder.type });
                });
            });
            existenceAnswers = await Promise.allSettled(existenceCalls);
        }
        if (token !== this.referencesToken) {
            return;
        }

        const folderExistence = new Map<string, boolean>();
        let existenceFailed = false;
        for (const [index, answer] of existenceAnswers.entries()) {
            if (answer.status === "fulfilled") {
                folderExistence.set(unlisted[index].id, answer.value);
            } else {
                existenceFailed = true;
            }
        }

        const users = partitionSettled(userAnswers);
        const teams = partitionSettled(teamAnswers);
        const foldersMissing = needsFolders && listed === null;
        const failed = users.failed || teams.failed || existenceFailed || foldersMissing;
        const foundUsers = users.values.flatMap(list => list.users);
        const missingUserIds = users.values.flatMap(list => list.missingIds);
        const foundTeams = teams.values.flatMap(list => list.teams);
        const missingTeamIds = teams.values.flatMap(list => list.missingIds);
        this.applyResolvedReferences(
            {
                previous: this.references,
                requested: missing,
                users: foundUsers,
                missingUserIds,
                teams: foundTeams,
                missingTeamIds,
                folders: listedFolders,
                folderExistence
            },
            failed
        );
    }

    // One action for both writes: this runs after awaits, outside the action of `resolveReferences`.
    private applyResolvedReferences(params: ResolveRuleReferencesParams, failed: boolean): void {
        this.references = resolveRuleReferences(params);
        this.referencesFailed = failed;
        this.referencesLoading = false;
    }

    private cancelUserSearchTimer(): void {
        if (this.userSearchTimer !== null) {
            clearTimeout(this.userSearchTimer);
            this.userSearchTimer = null;
        }
    }

    private cancelMemberSearchTimer(): void {
        if (this.memberSearchTimer !== null) {
            clearTimeout(this.memberSearchTimer);
            this.memberSearchTimer = null;
        }
    }

    // Every found user the maps hold, as the pickers' `selected` list.
    private getKnownUsers(): WorkflowUserSummary[] {
        const users: WorkflowUserSummary[] = [];
        for (const label of this.references.users.values()) {
            if (label.state !== "found") {
                continue;
            }
            const teamIds = this.references.userTeamIds.get(label.id) ?? [];
            users.push({ id: label.id, displayName: label.label, teamIds });
        }
        return users;
    }

    private async runUserSearch(search: string): Promise<void> {
        this.usersToken += 1;
        const token = this.usersToken;
        this.usersLoading = true;
        this.usersFailed = false;
        const query = search === "" ? null : search;
        try {
            const result = await this.listWorkflowUsersUseCase.execute({
                search: query,
                ids: null,
                teamIds: null,
                limit: USER_SEARCH_LIMIT
            });
            if (token === this.usersToken) {
                this.applyUserResults(result.users);
            }
        } catch {
            if (token === this.usersToken) {
                this.applyUserSearchFailure();
            }
        }
    }

    private applyUserResults(users: WorkflowUserSummary[]): void {
        this.userResults = users;
        this.references = addFoundUsers(this.references, users);
        this.usersLoading = false;
    }

    private applyUserSearchFailure(): void {
        this.usersLoading = false;
        this.usersFailed = true;
    }

    private async runMemberSearch(stepTeamIds: string[], search: string): Promise<void> {
        this.membersToken += 1;
        const token = this.membersToken;
        this.memberKey = getMemberKey(stepTeamIds);
        this.membersFailed = false;
        // No teams (or teams off, R290): nobody can be a member, so nothing is asked.
        if (stepTeamIds.length === 0 || !this.isReviewAvailable()) {
            this.applyMemberResults([]);
            return;
        }
        this.membersLoading = true;
        const query = search === "" ? null : search;
        try {
            const result = await this.listWorkflowUsersUseCase.execute({
                search: query,
                ids: null,
                teamIds: stepTeamIds,
                limit: USER_SEARCH_LIMIT
            });
            if (token === this.membersToken) {
                this.applyMemberResults(result.users);
            }
        } catch {
            if (token === this.membersToken) {
                this.applyMemberSearchFailure();
            }
        }
    }

    private applyMemberResults(users: WorkflowUserSummary[]): void {
        this.memberResults = users;
        this.references = addFoundUsers(this.references, users);
        this.membersLoading = false;
    }

    private applyMemberSearchFailure(): void {
        this.membersLoading = false;
        this.membersFailed = true;
    }

    private async runTeamSearch(search: string): Promise<void> {
        this.teamsToken += 1;
        const token = this.teamsToken;
        this.teamsLoading = true;
        this.teamSearchFailed = false;
        const query = search === "" ? null : search;
        try {
            const result = await this.listWorkflowTeamsUseCase.execute({
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
        this.references = addFoundTeams(this.references, teams);
        this.teamsLoading = false;
    }

    private applyTeamSearchFailure(): void {
        this.teamsLoading = false;
        this.teamSearchFailed = true;
    }
}

export const WorkflowEditorPresenter = Abstraction.createImplementation({
    implementation: WorkflowEditorPresenterImpl,
    dependencies: [
        ListStepTypesUseCase,
        ListAutomationDefinitionsUseCase,
        ListNotificationTransportsUseCase,
        ListAiModelsUseCase,
        ListAiToolsUseCase,
        ListWorkflowTeamsUseCase,
        ListWorkflowUsersUseCase,
        IdentityContext,
        WorkflowEditorToasts
    ]
});
