import React from "react";
import { Admin, Api } from "webiny/extensions";

/**
 * Report a bug by talking to the app.
 *
 * Internal to this repo. The admin side records what you did and captures a screenshot; the API
 * side holds the GitHub token and drafts the issue with the first provider configured in AI
 * Power-Ups, so nobody testing a deployed instance has to configure anything.
 *
 * All three are optional. Without a token the API drafts the report and hands back a prefilled
 * GitHub "new issue" URL instead of filing it, which needs no credentials at all:
 *
 *   BUG_REPORT_GITHUB_TOKEN  PAT with Issues + Contents write. Absent means the URL fallback.
 *   BUG_REPORT_REPOSITORY    owner/name, defaults to webiny/webiny-js
 *   BUG_REPORT_LABELS        comma separated, defaults to "bug"
 *
 * See ./README.md.
 */
export const BugReporterExtension = () => {
    return (
        <>
            <Admin.Extension src={"@/extensions/bugReport/index.tsx"} />
            <Api.Extension src={"@/extensions/bugReport/api/BugReportFeature.ts"} />
            <Api.Extension src={"@/extensions/bugReport/api/BugReportGraphQLSchema.ts"} />

            <Api.BuildParam
                paramName={"BUG_REPORT_GITHUB_TOKEN"}
                value={process.env.BUG_REPORT_GITHUB_TOKEN || ""}
            />
            <Api.BuildParam
                paramName={"BUG_REPORT_REPOSITORY"}
                value={process.env.BUG_REPORT_REPOSITORY || "webiny/webiny-js"}
            />
            <Api.BuildParam
                paramName={"BUG_REPORT_LABELS"}
                value={process.env.BUG_REPORT_LABELS || "bug"}
            />
        </>
    );
};
