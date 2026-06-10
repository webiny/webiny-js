import { createAbstraction } from "@webiny/feature/admin";
import type { BackgroundTaskSettings } from "~/admin/shared/types.js";

export interface IGetBackgroundTaskSettingsGateway {
    execute(): Promise<BackgroundTaskSettings>;
}

export const GetBackgroundTaskSettingsGateway =
    createAbstraction<IGetBackgroundTaskSettingsGateway>("GetBackgroundTaskSettingsGateway");

export namespace GetBackgroundTaskSettingsGateway {
    export type Interface = IGetBackgroundTaskSettingsGateway;
}

export interface IGetBackgroundTaskSettingsUseCase {
    execute(): Promise<BackgroundTaskSettings>;
}

export const GetBackgroundTaskSettingsUseCase =
    createAbstraction<IGetBackgroundTaskSettingsUseCase>("GetBackgroundTaskSettingsUseCase");

export namespace GetBackgroundTaskSettingsUseCase {
    export type Interface = IGetBackgroundTaskSettingsUseCase;
}
