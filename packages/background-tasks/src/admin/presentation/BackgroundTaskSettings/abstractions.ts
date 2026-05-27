import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IBackgroundTaskSettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
}

export interface IBackgroundTaskSettingsPresenter {
    vm: IBackgroundTaskSettingsViewModel;
    save(): Promise<boolean>;
    init(): void;
}

export const BackgroundTaskSettingsPresenter = createAbstraction<IBackgroundTaskSettingsPresenter>(
    "BackgroundTaskSettingsPresenter"
);

export namespace BackgroundTaskSettingsPresenter {
    export type Interface = IBackgroundTaskSettingsPresenter;
    export type ViewModel = IBackgroundTaskSettingsViewModel;
}
