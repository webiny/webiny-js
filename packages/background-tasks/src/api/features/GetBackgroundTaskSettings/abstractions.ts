import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IBackgroundTaskSettings } from "~/api/domain/BackgroundTaskSettings.js";
import type {
    BackgroundTaskModelNotFoundError,
    BackgroundTaskPersistenceError
} from "~/api/domain/errors.js";

type IError = BackgroundTaskModelNotFoundError | BackgroundTaskPersistenceError;

export interface IGetBackgroundTaskSettingsRepository {
    execute(): Promise<Result<IBackgroundTaskSettings, IError>>;
}

export const GetBackgroundTaskSettingsRepository =
    createAbstraction<IGetBackgroundTaskSettingsRepository>(
        "BackgroundTasks/GetBackgroundTaskSettingsRepository"
    );

export namespace GetBackgroundTaskSettingsRepository {
    export type Interface = IGetBackgroundTaskSettingsRepository;
    export type Error = IError;
}
