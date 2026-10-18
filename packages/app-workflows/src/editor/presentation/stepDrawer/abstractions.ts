import { createAbstraction } from "@webiny/feature/admin";
import type { FormModel } from "@webiny/app-admin";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import type { ReferencesStatus } from "~/editor/presentation/editor/abstractions.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { DrawerInspectParams } from "~/editor/presentation/editor/abstractions.js";
import type { FolderOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { UserOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import type { SwitchAutomationConfirmationVm } from "~/editor/presentation/stepForm/buildSwitchConfirmation.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";

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
    // The open workflow's model namespace (`cms.article`, `wb.page`); null with no model open.
    getNamespace(): string | null;
    // Tells the editor the drawer closed itself (Done, X, Escape, scrim, a vanished step): `vm.openStepId` becomes null.
    closeStep(): void;
}

export interface StepDrawerAlertVm {
    title: string;
    text: string;
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
