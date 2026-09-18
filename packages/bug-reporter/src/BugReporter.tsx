import React from "react";
import { Api, Admin } from "@webiny/project-aws";

/**
 * Report a bug by talking to the app.
 *
 * On in every Webiny project, no flag and nothing to configure. With no GitHub token the API
 * writes the report up and hands back a prefilled `issues/new` URL for the reporter to submit
 * themselves, which needs no credentials at all — so the zero-config path is a working feature
 * rather than a disabled one.
 *
 * Drafting is not here. The base files the reporter's own words; `extensions/bugReportAi`
 * decorates `IssueDrafter` to add a title and steps to reproduce.
 */
export const BugReporter = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />

            {/* All optional. Without a token the API returns a prefilled GitHub URL instead
                of filing, which needs no credentials. Read at build time, so CI can hold
                them as secrets.

                The token needs write on BOTH issues and contents. Contents is not optional
                once anyone pastes an image: GitHub's issue API has no attachment endpoint,
                so screenshots are committed to a `bug-report-assets` branch and linked.
                A classic PAT covers both with one `repo` scope. */}
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
