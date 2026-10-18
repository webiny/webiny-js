import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { DrawerInspectParams } from "~/editor/presentation/editor/abstractions.js";
import type { FolderOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { UserOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { ReferencesStatus } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import type { StepDrawerSource } from "~/editor/presentation/stepDrawer/abstractions.js";
import { createEditorOptions } from "./createEditorOptions.js";
import { createTeamOptions } from "./createTeamOptions.js";

/*
 * The accessors of the editor presenter the drawer reads, over plain MobX state, so the drawer's
 * reactions fire when a list or the read-only state changes. The commands are mocks.
 */
export class FakeStepDrawerSource implements StepDrawerSource {
    steps: EditorStep[];
    options: WorkflowEditorOptions = createEditorOptions();
    teams: WorkflowTeamOptions = createTeamOptions();
    readOnly = false;
    errors: StepFieldError[] = [];
    namespace: string | null = "cms.article";
    references: RuleReferences = createEmptyRuleReferences();
    referencesStatus: ReferencesStatus = { loading: false, failed: false };
    retryReferences: Mock<() => void> = vi.fn();
    users: UserOptionsState = { items: [], selected: [], loading: false, failed: false };
    members: UserOptionsState = { items: [], selected: [], loading: false, failed: false };
    folders: FolderOptionsState = { items: [], loading: false, failed: false };
    modelId: string | null = "article";
    folderType = "cms:article";
    searchUsers: Mock<(search: string) => void> = vi.fn();
    retryUsers: Mock<() => void> = vi.fn();
    searchTargetMembers: Mock<(stepTeamIds: string[], search: string) => void> = vi.fn();
    retryTargetMembers: Mock<(stepTeamIds: string[]) => void> = vi.fn();
    inspectRouting: Mock<(params: DrawerInspectParams) => Promise<RoutingInspection>> = vi.fn();
    updateStep: Mock<(stepId: string, patch: EditorStepPatch) => void> = vi.fn();
    closeStep: Mock<() => void> = vi.fn();
    searchTeams: Mock<(search: string) => void> = vi.fn();
    retryTeams: Mock<() => Promise<void>> = vi.fn().mockResolvedValue(undefined);
    retryOptions: Mock<() => Promise<void>> = vi.fn().mockResolvedValue(undefined);

    constructor(steps: EditorStep[]) {
        this.steps = steps;
        makeAutoObservable(this, {
            steps: observableRef,
            options: observableRef,
            teams: observableRef,
            errors: observableRef,
            references: observableRef,
            referencesStatus: observableRef,
            retryReferences: false,
            users: observableRef,
            members: observableRef,
            folders: observableRef,
            searchUsers: false,
            retryUsers: false,
            searchTargetMembers: false,
            retryTargetMembers: false,
            inspectRouting: false,
            updateStep: false,
            closeStep: false,
            searchTeams: false,
            retryTeams: false,
            retryOptions: false
        });
    }

    getStep(stepId: string): EditorStep | null {
        return this.steps.find(step => step.id === stepId) ?? null;
    }

    getStepFieldErrors(): StepFieldError[] {
        return this.errors;
    }

    isStepReadOnly(): boolean {
        return this.readOnly;
    }

    getOptions(): WorkflowEditorOptions {
        return this.options;
    }

    getTeamOptions(): WorkflowTeamOptions {
        return this.teams;
    }

    getNamespace(): string | null {
        return this.namespace;
    }

    getReferences(): RuleReferences {
        return this.references;
    }

    getReferencesStatus(): ReferencesStatus {
        return this.referencesStatus;
    }

    setReferences(references: RuleReferences): void {
        this.references = references;
    }

    getUserOptions(): UserOptionsState {
        return this.users;
    }

    getTargetMemberOptions(): UserOptionsState {
        return this.members;
    }

    getFolderOptions(): FolderOptionsState {
        return this.folders;
    }

    getFolderType(): string {
        return this.folderType;
    }

    getModelId(): string | null {
        return this.modelId;
    }

    setUsers(users: UserOptionsState): void {
        this.users = users;
    }

    setMembers(members: UserOptionsState): void {
        this.members = members;
    }

    setFolders(folders: FolderOptionsState): void {
        this.folders = folders;
    }

    setReferencesStatus(status: ReferencesStatus): void {
        this.referencesStatus = status;
    }

    setSteps(steps: EditorStep[]): void {
        this.steps = steps;
    }

    setOptions(options: WorkflowEditorOptions): void {
        this.options = options;
    }

    setTeams(teams: WorkflowTeamOptions): void {
        this.teams = teams;
    }

    setReadOnly(readOnly: boolean): void {
        this.readOnly = readOnly;
    }
}
