import { createAbstraction } from "@webiny/feature/api";
import { z } from "zod";
import type { IBugReportPayload } from "../../shared/types.js";

/*
 * Exported as the bare zod schema rather than a ready-made `Output.object(...)`: the AI SDK's
 * `Output` type can't be named in emitted declarations (TS4023), so the call site wraps it.
 */
export const issueDraftSchema = z.object({
    title: z.string(),
    summary: z.string(),
    stepsToReproduce: z.array(z.string()),
    expected: z.string(),
    actual: z.string()
});

export interface IIssueDraft {
    title: string;
    summary: string;
    stepsToReproduce: string[];
    expected: string;
    actual: string;
}

export interface IIssueDrafter {
    /*
     * Never fails: with no AI provider configured, or when the model call errors, the reporter's
     * own words are the draft. A verbatim report plus the timeline is still a usable issue.
     */
    execute(payload: IBugReportPayload, timeline: string): Promise<IIssueDraft>;
}

export const IssueDrafter = createAbstraction<IIssueDrafter>("BugReport/IssueDrafter");

export namespace IssueDrafter {
    export type Interface = IIssueDrafter;
    export type Draft = IIssueDraft;
}
