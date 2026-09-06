import { createAbstraction } from "webiny/admin";

export interface IBugReportSettingsValues {
    /* Fine-grained GitHub PAT, supplied by whoever enables the tool. Never shared. */
    githubToken: string;
    /* "owner/name", e.g. "webiny/webiny-js". */
    repository: string;
    /* Comma-separated labels applied to every issue this tool files. */
    labels: string;
    /* Optional. Without it the report is filed verbatim instead of being drafted. */
    anthropicApiKey: string;
    includeScreenshot: boolean;
}

export interface IBugReportSettings {
    readonly values: IBugReportSettingsValues;
    readonly isConfigured: boolean;
    readonly labelList: string[];
    update(values: Partial<IBugReportSettingsValues>): void;
}

export const BugReportSettings = createAbstraction<IBugReportSettings>("BugReport/Settings");

export namespace BugReportSettings {
    export type Interface = IBugReportSettings;
    export type Values = IBugReportSettingsValues;
}
