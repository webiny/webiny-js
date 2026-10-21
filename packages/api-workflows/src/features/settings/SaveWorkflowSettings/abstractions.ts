import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type {
    WorkflowSettingsPersistenceError,
    WorkflowSettingsValidationError
} from "~/domain/settings/errors.js";

export interface ISaveWorkflowSettingsUseCaseErrors {
    validation: WorkflowSettingsValidationError;
    persistence: WorkflowSettingsPersistenceError;
}

type UseCaseError = ISaveWorkflowSettingsUseCaseErrors[keyof ISaveWorkflowSettingsUseCaseErrors];

export interface ISaveWorkflowSettingsUseCase {
    execute(input: WorkflowSettings): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/**
 * Save the whole settings record; last save wins (D106). Internal (D132): the shared settings
 * operation checks `editor` (D133).
 */
export const SaveWorkflowSettingsUseCase = createAbstraction<ISaveWorkflowSettingsUseCase>(
    "SaveWorkflowSettingsUseCase"
);

export namespace SaveWorkflowSettingsUseCase {
    export type Interface = ISaveWorkflowSettingsUseCase;
    export type Input = WorkflowSettings;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
