import { createAbstraction } from "@webiny/feature/admin";
import { FormModel } from "@webiny/app-admin";

export interface IAiPowerUpsSettingsVm {
    loading: boolean;
    saving: boolean;
    form: FormModel.FormVM | null;
    error: string | null;
}

export interface IAiPowerUpsSettingsPresenter {
    readonly vm: IAiPowerUpsSettingsVm;
    init(): Promise<void>;
    save(): Promise<boolean>;
    importData(data: Record<string, unknown>): void;
}

export const AiPowerUpsSettingsPresenter = createAbstraction<IAiPowerUpsSettingsPresenter>(
    "AiPowerUps/SettingsPresenter"
);

export namespace AiPowerUpsSettingsPresenter {
    export type Interface = IAiPowerUpsSettingsPresenter;
    export type ViewModel = IAiPowerUpsSettingsVm;
}
