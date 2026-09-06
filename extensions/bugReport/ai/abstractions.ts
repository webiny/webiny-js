import { createAbstraction } from "webiny/admin";
import type { IEnvironmentInfo } from "../capture/collectEnvironment.js";

export interface IIssueDraft {
    title: string;
    summary: string;
    stepsToReproduce: string[];
    expected: string;
    actual: string;
    labels: string[];
}

export interface IDraftIssueInput {
    /* What the reporter said or typed, verbatim. */
    description: string;
    environment: IEnvironmentInfo;
    timeline: string;
    labels: string[];
}

export interface IIssueDrafter {
    draft(input: IDraftIssueInput): Promise<IIssueDraft>;
}

export const IssueDrafter = createAbstraction<IIssueDrafter>("BugReport/IssueDrafter");

export namespace IssueDrafter {
    export type Interface = IIssueDrafter;
    export type Draft = IIssueDraft;
    export type Input = IDraftIssueInput;
}
