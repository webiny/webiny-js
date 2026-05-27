import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IBackgroundTaskSettings } from "~/api/domain/BackgroundTaskSettings.js";
import type {
    BackgroundTaskModelNotFoundError,
    BackgroundTaskNotAuthorizedError,
    BackgroundTaskPersistenceError,
    BackgroundTaskValidationError
} from "~/api/domain/errors.js";

export interface IUpdateBackgroundTaskSettingsInput {
    retentionDays?: number;
}

type IError =
    | BackgroundTaskModelNotFoundError
    | BackgroundTaskPersistenceError
    | BackgroundTaskNotAuthorizedError
    | BackgroundTaskValidationError;

export interface IUpdateBackgroundTaskSettingsUseCase {
    execute(
        input: IUpdateBackgroundTaskSettingsInput
    ): Promise<Result<IBackgroundTaskSettings, IError>>;
}

export const UpdateBackgroundTaskSettingsUseCase =
    createAbstraction<IUpdateBackgroundTaskSettingsUseCase>(
        "BackgroundTasks/UpdateBackgroundTaskSettingsUseCase"
    );

export namespace UpdateBackgroundTaskSettingsUseCase {
    export type Interface = IUpdateBackgroundTaskSettingsUseCase;
    export type Input = IUpdateBackgroundTaskSettingsInput;
    export type Error = IError;
}

type IRepositoryError = BackgroundTaskModelNotFoundError | BackgroundTaskPersistenceError;

export interface IUpdateBackgroundTaskSettingsRepository {
    execute(
        input: IUpdateBackgroundTaskSettingsInput
    ): Promise<Result<IBackgroundTaskSettings, IRepositoryError>>;
}

export const UpdateBackgroundTaskSettingsRepository =
    createAbstraction<IUpdateBackgroundTaskSettingsRepository>(
        "BackgroundTasks/UpdateBackgroundTaskSettingsRepository"
    );

export namespace UpdateBackgroundTaskSettingsRepository {
    export type Interface = IUpdateBackgroundTaskSettingsRepository;
    export type Error = IRepositoryError;
}
