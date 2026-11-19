import { createAbstraction } from "@webiny/feature/admin";

export interface ITestMailResult {
    type: "success" | "danger";
    message: string;
}

/**
 * Lets a transport's settings form hold the test back, for example while it has unsaved changes:
 * the test runs against the saved settings, not the ones on screen. While any guard returns a
 * reason, the test cannot run and the previous result is hidden.
 */
export interface ITestMailGuard {
    getDisabledReason(): string | null;
}

export const TestMailGuard = createAbstraction<ITestMailGuard>("Mailer/TestMailGuard");

export namespace TestMailGuard {
    export type Interface = ITestMailGuard;
}

/**
 * What a transport's settings form needs from the test email: a form does not save while a test is
 * sending, and a save drops the result, which described the old settings.
 */
export interface ITestMailState {
    readonly sending: boolean;
    clearResult(): void;
}

export const TestMailState = createAbstraction<ITestMailState>("Mailer/TestMailState");

export namespace TestMailState {
    export type Interface = ITestMailState;
}

/**
 * The run protocol behind `TestMailState`, driven only by `TestMailPresenter`. Not exported from
 * the package.
 */
export interface ITestMailRuns extends ITestMailState {
    readonly result: ITestMailResult | null;
    /** Starts a run and returns its id. */
    start(): number;
    /** Ends a run. A run that `reset()` made stale is ignored. */
    finish(run: number, result: ITestMailResult): void;
    /** Drops the run in flight and the result, which would otherwise outlive the screen. */
    reset(): void;
}

export const TestMailRuns = createAbstraction<ITestMailRuns>("Mailer/TestMailRuns");

export namespace TestMailRuns {
    export type Interface = ITestMailRuns;
}

export interface ITestMailViewModel {
    recipient: string;
    sending: boolean;
    /** Why the test cannot run right now, or null when it can. */
    disabledReason: string | null;
    result: ITestMailResult | null;
}

export interface ITestMailPresenter {
    vm: ITestMailViewModel;
    /** Fills in the signed-in user's address as the recipient. */
    init(): void;
    setRecipient(recipient: string): void;
    send(): Promise<void>;
    dispose(): void;
}

export const TestMailPresenter = createAbstraction<ITestMailPresenter>("Mailer/TestMailPresenter");

export namespace TestMailPresenter {
    export type Interface = ITestMailPresenter;
    export type ViewModel = ITestMailViewModel;
}
