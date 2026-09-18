import { createAbstraction } from "@webiny/feature/admin";

/*
 * Only set when the API filed the issue itself. Compose mode has nothing to show: GitHub opens
 * with the report already in it, so a confirmation would just be a step between the reporter and
 * the thing they asked for.
 */
export interface IReportBugOutcomeVm {
    url: string;
}

export interface IReportBugViewModel {
    open: boolean;
    description: string;
    /* Data URLs, ready to render, in the order they were pasted. */
    screenshots: string[];
    recordedEventCount: number;
    busy: boolean;
    statusLabel: string | null;
    error: string | null;
    outcome: IReportBugOutcomeVm | null;
    /* Set only when a pop-up blocker refused the composer, so it can be offered as a link. */
    composeUrl: string | null;
    canSubmit: boolean;
}

export interface IReportBugPresenter {
    readonly vm: IReportBugViewModel;
    open(): void;
    close(): void;
    describe(description: string): void;
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
    export type Outcome = IReportBugOutcomeVm;
}
