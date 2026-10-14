import { createAbstraction } from "@webiny/feature/admin";

export interface IDebuggerViewModel {
    // Whether the identity holds the permission; nothing debug related renders without it.
    available: boolean;
    captureOn: boolean;
    sessionCount: number;
    entryCount: number;
}

export interface IDebuggerPresenter {
    readonly vm: IDebuggerViewModel;
    setCaptureOn(enabled: boolean): void;
    clear(): void;
    downloadReport(): void;
}

export const DebuggerPresenter = createAbstraction<IDebuggerPresenter>("DebuggerPresenter");

export namespace DebuggerPresenter {
    export type Interface = IDebuggerPresenter;
    export type ViewModel = IDebuggerViewModel;
}
