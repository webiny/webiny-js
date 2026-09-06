import { createAbstraction } from "webiny/admin";

export interface IReportBugViewModel {
    open: boolean;
    description: string;
    listening: boolean;
    dictationSupported: boolean;
    screenshot: string | null;
    recordedEventCount: number;
    busy: boolean;
    statusLabel: string | null;
    error: string | null;
    issueUrl: string | null;
    canSubmit: boolean;
}

export interface IReportBugPresenter {
    readonly vm: IReportBugViewModel;
    open(): Promise<void>;
    close(): void;
    describe(description: string): void;
    toggleDictation(): void;
    retakeScreenshot(): Promise<void>;
    discardScreenshot(): void;
    submit(): Promise<void>;
}

export const ReportBugPresenter = createAbstraction<IReportBugPresenter>(
    "BugReport/ReportBugPresenter"
);

export namespace ReportBugPresenter {
    export type Interface = IReportBugPresenter;
    export type ViewModel = IReportBugViewModel;
}
