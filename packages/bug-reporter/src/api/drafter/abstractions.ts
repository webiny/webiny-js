import { createAbstraction } from "@webiny/feature/api";
import type { IBugReportPayload } from "../../shared/types.js";

export interface IIssueDraft {
    title: string;
    summary: string;
    stepsToReproduce: string[];
    expected: string;
    actual: string;
}

export interface IIssueDrafter {
    /*
     * Never fails. The base implementation files the reporter's own words, which is a usable issue
     * on its own — the timeline and screenshots carry the evidence either way.
     *
     * AI drafting decorates this rather than replacing it: see the bug reporter AI extension, which
     * falls back to whatever this returns when no model role is configured or the call errors.
     */
    execute(payload: IBugReportPayload, timeline: string): Promise<IIssueDraft>;
}

export const IssueDrafter = createAbstraction<IIssueDrafter>("BugReport/IssueDrafter");

export namespace IssueDrafter {
    export type Interface = IIssueDrafter;
    export type Draft = IIssueDraft;
}
