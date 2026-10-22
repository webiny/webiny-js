import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type { WorkflowLookupError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";
import type { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";

export interface GetWorkflowSettingsForEditorInput {
    /** Include expired exclusions, so the settings page can edit them (D105). */
    includeExpired?: boolean | null;
}

export interface IGetWorkflowSettingsForEditorUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    lookup: WorkflowLookupError;
    get: GetWorkflowSettingsUseCase.Error;
}

type UseCaseError =
    IGetWorkflowSettingsForEditorUseCaseErrors[keyof IGetWorkflowSettingsForEditorUseCaseErrors];

export interface IGetWorkflowSettingsForEditorUseCase {
    execute(
        input?: GetWorkflowSettingsForEditorInput
    ): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/**
 * The tenant's workflow settings for the settings page (spec 4.4, D133 point 2, R97): needs
 * `workflows.editor`. The shared `getSettings` GraphQL operation calls this, never the engine.
 */
export const GetWorkflowSettingsForEditorUseCase =
    createAbstraction<IGetWorkflowSettingsForEditorUseCase>("GetWorkflowSettingsForEditorUseCase");

export namespace GetWorkflowSettingsForEditorUseCase {
    export type Interface = IGetWorkflowSettingsForEditorUseCase;
    export type Input = GetWorkflowSettingsForEditorInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
