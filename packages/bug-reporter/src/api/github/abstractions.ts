import { createAbstraction } from "@webiny/feature/api";
import type { IFiledIssue } from "../../shared/types.js";
import type { IReportedScreenshot } from "../../shared/types.js";

export interface ICreateIssueInput {
    title: string;
    body: string;
    labels: string[];
}

export interface IGitHubIssueGateway {
    /* Commits an image to the assets branch and returns a URL GitHub renders in markdown. */
    uploadScreenshot(screenshot: IReportedScreenshot): Promise<string>;
    createIssue(input: ICreateIssueInput): Promise<IFiledIssue>;
}

export const GitHubIssueGateway = createAbstraction<IGitHubIssueGateway>(
    "BugReport/GitHubIssueGateway"
);

export namespace GitHubIssueGateway {
    export type Interface = IGitHubIssueGateway;
    export type CreateIssueInput = ICreateIssueInput;
}
