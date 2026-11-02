import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type { WorkflowLookupError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";
import type { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";

export interface ISaveWorkflowSettingsForEditorUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    lookup: WorkflowLookupError;
    save: SaveWorkflowSettingsUseCase.Error;
}

type UseCaseError =
    ISaveWorkflowSettingsForEditorUseCaseErrors[keyof ISaveWorkflowSettingsForEditorUseCaseErrors];

export interface ISaveWorkflowSettingsForEditorUseCase {
    execute(input: WorkflowSettings): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/**
 * Save the whole settings record, last save wins (spec 4.4, D106, D133 point 2, R97): needs
 * `workflows.editor`. The shared `updateSettings` GraphQL operation calls this.
 */
export const SaveWorkflowSettingsForEditorUseCase =
    createAbstraction<ISaveWorkflowSettingsForEditorUseCase>(
        "SaveWorkflowSettingsForEditorUseCase"
    );

export namespace SaveWorkflowSettingsForEditorUseCase {
    export type Interface = ISaveWorkflowSettingsForEditorUseCase;
    export type Input = WorkflowSettings;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
