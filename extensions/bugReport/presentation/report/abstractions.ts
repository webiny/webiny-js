import { createAbstraction } from "webiny/admin";

export interface IReportBugViewModel {
    open: boolean;
    description: string;
    listening: boolean;
    dictationSupported: boolean;
    /* Data URLs, ready to render, in the order they were pasted. */
    screenshots: string[];
    recordedEventCount: number;
    busy: boolean;
    statusLabel: string | null;
    error: string | null;
    issueUrl: string | null;
    canSubmit: boolean;
}

export interface IReportBugPresenter {
    readonly vm: IReportBugViewModel;
    open(): void;
    close(): void;
    describe(description: string): void;
    toggleDictation(): void;
    attachScreenshot(dataUrl: string): void;
    removeScreenshot(index: number): void;
    submit(): Promise<void>;
}

export const ReportBugPresenter = createAbstraction<IReportBugPresenter>(
    "BugReport/ReportBugPresenter"
);

export namespace ReportBugPresenter {
    export type Interface = IReportBugPresenter;
    export type ViewModel = IReportBugViewModel;
}
