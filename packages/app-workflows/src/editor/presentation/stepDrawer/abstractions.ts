import { createAbstraction } from "@webiny/feature/admin";
import type { FormModel } from "@webiny/app-admin";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { StepErrorTab } from "~/editor/model/getStepErrorTab.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import type { ReferencesStatus } from "~/editor/presentation/editor/abstractions.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
import type { DrawerInspectParams } from "~/editor/presentation/editor/abstractions.js";
import type { FolderOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { UserOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import type { SwitchAutomationConfirmationVm } from "~/editor/presentation/stepForm/buildSwitchConfirmation.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import type { TestRoutingStatus } from "./TestRoutingState.js";

// `review` is the People type (D98); any other type id is unknown and shown read-only (R270).
export type StepKind = "review" | "automation" | "ai" | "unknown";

/*
 * What the drawer reads from the editor presenter (Task 9's non-VM accessors, the R234 precedent):
 * the editor presenter satisfies it structurally and is passed to `open`.
 */
export interface StepDrawerSource {
    getStep(stepId: string): EditorStep | null;
    // The drawer's Done; also clears that step's errors.
    updateStep(stepId: string, patch: EditorStepPatch): void;
    // The client validation errors of a failed Save and the mapped server error of the step.
    getStepFieldErrors(stepId: string): StepFieldError[];
    isStepReadOnly(stepId: string): boolean;
    getOptions(): WorkflowEditorOptions;
    getTeamOptions(): WorkflowTeamOptions;
    searchTeams(search: string): void;
    retryTeams(): Promise<void>;
    retryOptions(): Promise<void>;
    // The resolved users, rule teams and folders of the open workflow (R298); replaced, never mutated.
    getReferences(): RuleReferences;
    getReferencesStatus(): ReferencesStatus;
    retryReferences(): void;
    // The step's warning lines as the card shows them, with its rule lines (they carry a `ruleId`, R312).
    getStepWarnings(stepId: string): StepWarningLine[];
    getUserOptions(): UserOptionsState;
    searchUsers(search: string): void;
    retryUsers(): void;
    getTargetMemberOptions(stepTeamIds: string[]): UserOptionsState;
    searchTargetMembers(stepTeamIds: string[], search: string): void;
    retryTargetMembers(stepTeamIds: string[]): void;
    getFolderOptions(): FolderOptionsState;
    getFolderType(): string;
    getModelId(): string | null;
    inspectRouting(params: DrawerInspectParams): Promise<RoutingInspection>;
    resolveInspectionNames(inspection: RoutingInspection): Promise<InspectionNames>;
    // The open workflow's model namespace (`cms.article`, `wb.page`); null with no model open.
    getNamespace(): string | null;
    // Tells the editor the drawer closed itself (Done, X, Escape, scrim, a vanished step): `vm.openStepId` becomes null.
    closeStep(): void;
}

export interface StepDrawerAlertVm {
    title: string;
    text: string;
}

// A server or Save error on one rule, ready for the rule card (R303).
export interface RuleErrorVm {
    ruleId: string;
    field: RuleIssue["field"];
    message: string;
}

// The Test routing tab's state, render-ready (R300).
export interface TestRoutingVm {
    requesterId: string | null;
    folderId: string | null;
    canRun: boolean;
    // `Choose a requester to test.` without a requester, else null.
    hint: string | null;
    buttonLabel: "Test routing" | "Testing…";
    status: TestRoutingStatus;
    // A done result whose configuration or inputs changed since the run.
    stale: boolean;
    result: TestRoutingResultVm | null;
    // `Could not test routing: …` after a failed run, else null.
    errorMessage: string | null;
}

// Render-ready (R234).
export interface IStepDrawerViewModel {
    open: boolean;
    kind: StepKind;
    typeLabel: string;
    title: string;
    subtitle: string;
    footerText: string;
    doneLabel: string;
    readOnly: boolean;
    licenceAlert: StepDrawerAlertVm | null;
    topError: string | null;
    form: FormModel.FormVM | null;
    switchConfirmation: SwitchAutomationConfirmationVm | null;
    // The tab that holds an error, or null (R302): the view shows the banner when it is not the open tab.
    errorTab: StepErrorTab | null;
    // `This step needs teams, which are not enabled. It can't be edited.` for a People step while teams are off.
    notice: string | null;
    // The `Check this step` lines: the step's warnings and the live `Rule {n}: ` lines (R312).
    warnings: StepWarningLine[];
    // Server and Save errors on rules, by rule (R303).
    ruleErrors: RuleErrorVm[];
    // The live issues of the rules in the form: errors and warnings (R299).
    ruleIssues: RuleIssue[];
    // The Test routing tab of a People step; null for any other step and for a read-only one (R300).
    testRouting: TestRoutingVm | null;
}

export interface IStepDrawerPresenter {
    readonly vm: IStepDrawerViewModel;
    // The lists the renderers read through `StepFormOptionsContext`; not part of the view model, it carries callbacks.
    readonly formOptions: StepFormOptions;
    open(source: StepDrawerSource, stepId: string): void;
    // Applies the form to the draft and closes through `source.closeStep()`; stays open on an unfinished hex colour.
    done(): Promise<void>;
    // The X, Escape and the scrim: the same, without the hex block (an unfinished hex keeps the old colour).
    dismiss(): void;
    // Closes without applying and without telling the source; the view uses it when its `stepId` is null.
    close(): void;
    confirmSwitch(): void;
    cancelSwitch(): void;
    // Activates the tab that holds an error (the banner's Show, R302).
    showErrorTab(): void;
    // Clears the server errors of one rule (the rule card calls it when its field is edited).
    clearRuleError(ruleId: string): void;
    // The Test routing inputs (R315) and the run (R300).
    setTestRequester(id: string | null): void;
    setTestFolder(id: string | null): void;
    runTest(): Promise<void>;
    dispose(): void;
}

export const StepDrawerPresenter = createAbstraction<IStepDrawerPresenter>(
    "Workflows/Editor/StepDrawerPresenter"
);

export namespace StepDrawerPresenter {
    export type Interface = IStepDrawerPresenter;
    export type ViewModel = IStepDrawerViewModel;
    export type Source = StepDrawerSource;
}
