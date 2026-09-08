import { createAbstraction } from "@webiny/feature/admin";

export interface IReportBugOutcomeVm {
    /* "filed" — done, here is the issue. "compose" — open this and submit it yourself. */
    mode: "filed" | "compose";
    url: string;
    /* Only in "compose" mode, and only when there was something to paste. */
    remindToPasteScreenshot: boolean;
}

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
    outcome: IReportBugOutcomeVm | null;
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
