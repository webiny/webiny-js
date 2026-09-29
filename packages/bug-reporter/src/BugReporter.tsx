import React from "react";
import { Admin } from "@webiny/project-aws/admin.js";
import { Api } from "@webiny/project-aws/api.js";

/**
 * Report a bug by talking to the app.
 *
 * On in every Webiny project, and takes no configuration: with no GitHub token the API writes the
 * report up and opens a prefilled `issues/new` URL for the reporter to submit themselves, which
 * needs no credentials at all. That is why this is composed into `DefaultExtensions` — the
 * zero-config path is a working feature rather than a disabled one.
 *
 * To have the API file issues itself, add `<Project.BugReporter token={...} repository={...} />` to
 * the project's own `webiny.config.tsx`. That extension lives in `@webiny/project` rather than here,
 * because this package depends on `@webiny/project-aws` and the Project namespace reaching back into
 * it would close a cycle. It only emits build params, which the API reads.
 *
 * Drafting is not here either. The base files the reporter's own words; the `bug-report-ai`
 * extension decorates `IssueDrafter` to add a title and steps to reproduce.
 */
export const BugReporter = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
