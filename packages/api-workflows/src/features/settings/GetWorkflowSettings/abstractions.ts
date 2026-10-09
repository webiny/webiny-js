import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";

export interface GetWorkflowSettingsInput {
    /** Include expired exclusions. The settings page needs them so they can be edited (D105). */
    includeExpired?: boolean;
}

export interface IGetWorkflowSettingsUseCaseErrors {
    persistence: WorkflowSettingsPersistenceError;
}

type UseCaseError = IGetWorkflowSettingsUseCaseErrors[keyof IGetWorkflowSettingsUseCaseErrors];

export interface IGetWorkflowSettingsUseCase {
    execute(input?: GetWorkflowSettingsInput): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/** Read the tenant's workflow settings. No `editor` check in 1a (phase 1b). */
export const GetWorkflowSettingsUseCase = createAbstraction<IGetWorkflowSettingsUseCase>(
    "GetWorkflowSettingsUseCase"
);

export namespace GetWorkflowSettingsUseCase {
    export type Interface = IGetWorkflowSettingsUseCase;
    export type Input = GetWorkflowSettingsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
