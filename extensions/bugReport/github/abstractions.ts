import { createAbstraction } from "webiny/admin";

export interface IIssueInput {
    title: string;
    body: string;
    labels: string[];
}

export interface ICreatedIssue {
    number: number;
    url: string;
}

export interface IGitHubGateway {
    /* Commits a PNG to the assets branch and returns a URL GitHub renders in markdown. */
    uploadScreenshot(dataUrl: string): Promise<string>;
    createIssue(input: IIssueInput): Promise<ICreatedIssue>;
}

export const GitHubGateway = createAbstraction<IGitHubGateway>("BugReport/GitHubGateway");

export namespace GitHubGateway {
    export type Interface = IGitHubGateway;
    export type Issue = ICreatedIssue;
}
