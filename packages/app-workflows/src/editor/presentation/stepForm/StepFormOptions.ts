import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";

// What every list a step form reads has: whether it is loading, whether loading failed, and a retry.
export interface StepFormListState {
    loading: boolean;
    failed: boolean;
    retry: () => void;
}

export interface StepFormTeamsOptions extends StepFormListState {
    // The search results, already limited by the picker (R282).
    options: PickerOption[];
    // The chosen teams with their labels, so a chip keeps its name when a search narrows the list.
    selected: PickerOption[];
    search: (query: string) => void;
}

export interface StepFormTransportOption {
    id: string;
    title: string;
    description: string | null;
}

export interface StepFormTransportsOptions extends StepFormListState {
    options: StepFormTransportOption[];
}

export interface StepFormAutomationOption {
    id: string;
    name: string;
    description: string | null;
}

export interface StepFormAutomationsOptions extends StepFormListState {
    // The definitions covering the workflow's model (R274).
    options: StepFormAutomationOption[];
    // The reason shown instead of the cards when there are none.
    emptyText: string;
    // `The automation “{name}” no longer exists.` or null.
    warning: string | null;
    // `Saved settings no longer validate: {error}` or null (QBZ-13).
    settingsWarning: string | null;
    select: (id: string) => void;
}

export interface StepFormAiModelsOptions extends StepFormListState {
    options: PickerOption[];
    // The stored model, also when it is retired (QBZ-8) or the list failed.
    selected: PickerOption | null;
    // The list loaded and has no model.
    empty: boolean;
    search: (query: string) => void;
}

export interface StepFormAiToolOption {
    name: string;
    title: string;
    description: string;
    // The tool can edit the revision under review (R283): the form tags it `Changes content`.
    changesContent: boolean;
}

export interface StepFormAiToolsOptions extends StepFormListState {
    options: StepFormAiToolOption[];
}

/*
 * What a People step's rule list and pickers need of the step as the form holds it now (R293): a
 * layout element or a field renderer cannot read a sibling field, so the drawer hands them over.
 */
export interface StepFormAssignmentOptions {
    // The ids of the reviewing teams, as the `teams` field holds them now.
    stepTeamIds: string[];
    // The `assignment.strategy` field's value; null for a stored strategy the editor does not know.
    strategy: string | null;
}

// The user search (R307): the requester pickers and the automation `user` hint.
export interface StepFormUsersOptions extends StepFormListState {
    // The search results, already limited by the picker.
    items: WorkflowUserSummary[];
    // The users known by id (picked, saved or resolved), so a picker keeps its label when a search narrows the list.
    selected: WorkflowUserSummary[];
    searchUsers: (query: string) => void;
}

// The members of the reviewing teams (R307): the options of a rule's target picker.
export interface StepFormTargetMembersOptions extends StepFormListState {
    items: WorkflowUserSummary[];
    selected: WorkflowUserSummary[];
    searchTargetMembers: (stepTeamIds: string[], search: string) => void;
}

// The folders of the app (R292): the complete list, so a picker filters it itself.
export interface StepFormFoldersOptions extends StepFormListState {
    items: AppFolder[];
    // The folder type a rule stores when the admin picks a folder (`cms:<modelId>`, `wb:page`).
    folderType: string;
}

// Saved user, team and folder ids resolved to labels (R298); `loading` and `failed` describe the resolution.
export interface StepFormReferencesOptions extends StepFormListState, RuleReferences {}

// A server rule error, mapped to its rule and field by the drawer (R303).
export interface StepFormRuleError {
    ruleId: string;
    field: RuleIssue["field"];
    message: string;
}

export interface StepFormRuleErrorsOptions {
    items: StepFormRuleError[];
    // Editing a rule or removing it clears that rule's error and nothing else (R303).
    clearRuleError: (ruleId: string) => void;
}

// The live rule issues of the open step (R299): errors and warnings per rule and field.
export interface StepFormRuleIssuesOptions {
    items: RuleIssue[];
}

/*
 * The Test routing state of the open step (R300): the shape of Task 17's `TestRoutingVm`, declared
 * here so the form code does not depend on the drawer presenter (Task 18 runs before Tasks 16
 * and 17, which need its form). The two are structurally the same type.
 */
export interface StepFormTestRoutingVm {
    requesterId: string | null;
    folderId: string | null;
    canRun: boolean;
    hint: string | null;
    buttonLabel: "Test routing" | "Testing…";
    status: "idle" | "running" | "done" | "failed";
    stale: boolean;
    result: TestRoutingResultVm | null;
    errorMessage: string | null;
}

// The Test routing slice: the state and its plain callbacks.
export interface StepFormTestRoutingOptions {
    vm: StepFormTestRoutingVm;
    setTestRequester: (id: string | null) => void;
    setTestFolder: (id: string | null) => void;
    runTest: () => void;
}

// The one value the drawer provides to every renderer of a step form (R234: the presenter owns the data).
export interface StepFormOptions {
    teams: StepFormTeamsOptions;
    transports: StepFormTransportsOptions;
    automations: StepFormAutomationsOptions;
    aiModels: StepFormAiModelsOptions;
    aiTools: StepFormAiToolsOptions;
    assignment: StepFormAssignmentOptions;
    users: StepFormUsersOptions;
    targetMembers: StepFormTargetMembersOptions;
    folders: StepFormFoldersOptions;
    references: StepFormReferencesOptions;
    ruleErrors: StepFormRuleErrorsOptions;
    ruleIssues: StepFormRuleIssuesOptions;
    testRouting: StepFormTestRoutingOptions;
}
