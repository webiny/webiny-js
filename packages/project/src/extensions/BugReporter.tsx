import React from "react";
import { z } from "zod";
import { BuildParam } from "./ApiBuildParam.js";
import { defineExtension } from "~/defineExtension/index.js";

/*
 * The bug reporter is enabled in every project through DefaultExtensions, so this extension is not
 * what turns it on. Without it the reporter runs in compose mode: the API writes the report up and
 * returns a prefilled GitHub issues/new URL, which the reporter submits under their own account and
 * which needs no credentials. This is what switches it to filing the issue itself.
 *
 * Lives here rather than in @webiny/bug-reporter because that package already depends on
 * @webiny/project-aws for `Api` and `Admin`, so having the Project namespace reach back into it
 * would close a cycle. Nothing is lost: the render only emits build params, and the API owns every
 * default, so there is one place they live rather than two that can drift.
 */
export const BugReporter = defineExtension({
    type: "Project/BugReporter",
    tags: { runtimeContext: "project" },
    description: "Point the bug reporter at a GitHub repository, so the API files issues itself.",
    paramsSchema: z.object({
        token: z
            .string()
            .optional()
            .describe(
                "GitHub PAT with write on BOTH issues and contents. Contents is not optional once anyone pastes a screenshot: issues have no attachment API, so images are committed to a branch. Always pass it through an env var, never a literal, since the value is serialized into the build artifact."
            ),
        repository: z
            .string()
            .optional()
            .describe(
                "Target repository as `owner/name`. Filing requires this as well as a token; a token on its own leaves the reporter in compose mode."
            ),
        labels: z
            .string()
            .optional()
            .describe(
                "Comma separated labels applied to every issue. Defaults to `bug`. Every issue also gets `reported-in-app`."
            )
    }),
    render: ({ token, repository, labels }) => {
        return (
            <>
                {token ? <BuildParam paramName="BUG_REPORT_GITHUB_TOKEN" value={token} /> : null}
                {repository ? (
                    <BuildParam paramName="BUG_REPORT_REPOSITORY" value={repository} />
                ) : null}
                {labels ? <BuildParam paramName="BUG_REPORT_LABELS" value={labels} /> : null}
            </>
        );
    }
});
