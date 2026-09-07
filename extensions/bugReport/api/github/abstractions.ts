import { createAbstraction } from "webiny/api";
import type { IFiledIssue } from "../../shared/types.js";

export interface ICreateIssueInput {
    title: string;
    body: string;
    labels: string[];
}

export interface IGitHubIssueGateway {
    /* False when this environment has no token configured, so the caller can say so plainly. */
    readonly configured: boolean;
    readonly labels: string[];
    /* Commits a PNG to the assets branch and returns a URL GitHub renders in markdown. */
    uploadScreenshot(base64: string): Promise<string>;
    createIssue(input: ICreateIssueInput): Promise<IFiledIssue>;
}

export const GitHubIssueGateway = createAbstraction<IGitHubIssueGateway>(
    "BugReport/GitHubIssueGateway"
);

export namespace GitHubIssueGateway {
    export type Interface = IGitHubIssueGateway;
    export type CreateIssueInput = ICreateIssueInput;
}
