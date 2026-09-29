import { createAbstraction } from "@webiny/feature/admin";

export type RecordedEventKind = "route" | "click" | "input" | "network" | "console" | "exception";

export interface IRecordedEvent {
    at: number;
    kind: RecordedEventKind;
    summary: string;
    detail?: string;
}

export interface IActionRecorder {
    start(): void;
    stop(): void;
    getEvents(): IRecordedEvent[];
}

export const ActionRecorder = createAbstraction<IActionRecorder>("BugReport/ActionRecorder");

export namespace ActionRecorder {
    export type Interface = IActionRecorder;
    export type Event = IRecordedEvent;
}
