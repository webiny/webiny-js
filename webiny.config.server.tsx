import React from "react";
import { Admin } from "webiny/extensions";
// Server-only namespaces come from the server flavour package (webiny/extensions currently exposes
// the AWS namespaces, which don't include server-only extensions like Infra.Sqlite).
import { Infra } from "@webiny/project-server";
import { SelfHostedAuth } from "@webiny/self-hosted-auth";

/**
 * Server-only (self-hosted) extensions, rendered by webiny.config.tsx when WEBINY_FLAVOUR === "server".
 * No Pulumi / no AWS infra here.
 */
export const ServerExtensions = () => {
    return (
        <>
            {/* SQL database. Relative paths resolve against the project root (not the disposable app
                workspace), so data persists across builds/watch restarts. */}
            <Infra.Sqlite filename={process.env.WEBINY_SQL_FILENAME || "./.webiny/server.sqlite"} />

            {/* Hand the admin app the API URL (AWS derives this from stack output; server has none). */}
            <Admin.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />

            {/* Auth: built-in self-hosted IdP (login screen + JWT). Back the secret with any env var. */}
            <SelfHostedAuth
                signingSecret={
                    process.env.WEBINY_SELF_HOSTED_AUTH_SECRET || "dev-only-insecure-secret"
                }
            />
        </>
    );
};
