import { createAbstraction } from "@webiny/feature/api";

export interface IBugReportConfig {
    readonly token: string;
    /* "owner/name". Always has a value, so the composer fallback works with zero config. */
    readonly repository: string;
    readonly labels: string[];
    /* True when there is a token to file with. False means the composer fallback. */
    readonly canFileDirectly: boolean;
}

export const BugReportConfig = createAbstraction<IBugReportConfig>("BugReport/Config");

export namespace BugReportConfig {
    export type Interface = IBugReportConfig;
}
