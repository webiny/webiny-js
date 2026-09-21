import React from "react";
import { Api } from "@webiny/project-aws";

export interface IBugReporterGitHubProps {
    /**
     * A PAT with write on BOTH issues and contents.
     *
     * Contents is not optional once anyone pastes an image: GitHub's issue API has no attachment
     * endpoint, so screenshots are committed to a `bug-report-assets` branch and linked. A classic
     * PAT covers both with one `repo` scope.
     *
     * Always pass this through a build-time env var — `token={process.env.MY_TOKEN}` — never a
     * literal. The value is serialized into the build artifact, so hard-coding it would commit the
     * secret to source control.
     *
     * Leave it out and the reporter stays in compose mode, which files nothing and needs no
     * credentials.
     */
    token?: string;
    /** `owner/name`. Defaults to `webiny/webiny-js`. */
    repository?: string;
    /** Comma separated. Defaults to `bug`. Every issue also gets `reported-in-app`. */
    labels?: string;
}

/**
 * Points the bug reporter at a GitHub repository, so it files issues itself instead of handing
 * the reporter a prefilled URL.
 *
 * Separate from `<BugReporter />` because that one is composed into every project by
 * `DefaultExtensions` and takes no configuration. This is what a project adds to its own
 * `webiny.config.tsx` when it wants filing:
 *
 *     <BugReporter.GitHub token={process.env.MY_GITHUB_TOKEN} repository={"acme/app"} />
 *
 * Only values actually supplied are emitted. The API owns the defaults for the rest, so there is
 * one place they live rather than two that can drift.
 */
export const BugReporterGitHub = ({ token, repository, labels }: IBugReporterGitHubProps) => {
    return (
        <>
            {token ? <Api.BuildParam paramName={"BUG_REPORT_GITHUB_TOKEN"} value={token} /> : null}
            {repository ? (
                <Api.BuildParam paramName={"BUG_REPORT_REPOSITORY"} value={repository} />
            ) : null}
            {labels ? <Api.BuildParam paramName={"BUG_REPORT_LABELS"} value={labels} /> : null}
        </>
    );
};
