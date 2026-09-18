import React from "react";
import { Api, Admin } from "@webiny/project-aws";
import { BugReporterGitHub } from "./GitHub.js";

/**
 * Report a bug by talking to the app.
 *
 * On in every Webiny project, and takes no configuration: with no GitHub token the API writes the
 * report up and opens a prefilled `issues/new` URL for the reporter to submit themselves, which
 * needs no credentials at all. That is why this is composed into `DefaultExtensions` — the
 * zero-config path is a working feature rather than a disabled one.
 *
 * To have the API file issues itself, add `<BugReporter.GitHub token={...} />` to the project's
 * own `webiny.config.tsx`. Kept separate so this component stays configuration-free and the
 * project decides where its secret comes from, rather than this package inventing env var names
 * and reading them behind the project's back.
 *
 * Drafting is not here either. The base files the reporter's own words; `extensions/bugReportAi`
 * decorates `IssueDrafter` to add a title and steps to reproduce.
 */
const BugReporterBase = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};

export const BugReporter = Object.assign(BugReporterBase, {
    GitHub: BugReporterGitHub
});
