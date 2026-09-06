import { createAbstraction } from "webiny/admin";
import type { IBugReportSettingsValues } from "../../settings/abstractions.js";

export interface IBugReportSettingsViewModel {
    open: boolean;
    values: IBugReportSettingsValues;
    canSave: boolean;
    hint: string | null;
}

export interface IBugReportSettingsPresenter {
    readonly vm: IBugReportSettingsViewModel;
    open(): void;
    close(): void;
    change(values: Partial<IBugReportSettingsValues>): void;
    save(): void;
}

export const BugReportSettingsPresenter = createAbstraction<IBugReportSettingsPresenter>(
    "BugReport/SettingsPresenter"
);

export namespace BugReportSettingsPresenter {
    export type Interface = IBugReportSettingsPresenter;
    export type ViewModel = IBugReportSettingsViewModel;
}
