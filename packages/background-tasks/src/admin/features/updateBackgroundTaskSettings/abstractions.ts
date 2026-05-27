import { createAbstraction } from "@webiny/feature/admin";
import type { BackgroundTaskSettings } from "~/admin/shared/types.js";

export interface UpdateBackgroundTaskSettingsInput {
    retentionDays?: number;
}

export interface IUpdateBackgroundTaskSettingsGateway {
    execute(input: UpdateBackgroundTaskSettingsInput): Promise<BackgroundTaskSettings>;
}

export const UpdateBackgroundTaskSettingsGateway =
    createAbstraction<IUpdateBackgroundTaskSettingsGateway>("UpdateBackgroundTaskSettingsGateway");

export namespace UpdateBackgroundTaskSettingsGateway {
    export type Interface = IUpdateBackgroundTaskSettingsGateway;
}

export interface IUpdateBackgroundTaskSettingsUseCase {
    execute(input: UpdateBackgroundTaskSettingsInput): Promise<BackgroundTaskSettings>;
}

export const UpdateBackgroundTaskSettingsUseCase =
    createAbstraction<IUpdateBackgroundTaskSettingsUseCase>("UpdateBackgroundTaskSettingsUseCase");

export namespace UpdateBackgroundTaskSettingsUseCase {
    export type Interface = IUpdateBackgroundTaskSettingsUseCase;
}
