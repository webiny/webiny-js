import React from "react";
import { Admin } from "webiny/extensions";
// Server-only namespaces come from the server hosting-type package. `webiny/extensions` exposes the
// AWS namespaces, which don't include server-only extensions like `Infra.Sqlite`.
import { Infra } from "@webiny/project-server";
import { SelfHostedAuth } from "@webiny/self-hosted-auth";

/**
 * Self-hosted (server) hosting-type project extensions. No AWS, no Pulumi, no `deploy` — a single
 * long-running Node HTTP server backed by SQL storage. Run it with `yarn webiny watch`.
 */
export const Extensions = () => {
    return (
        <>
            {/* SQL database. Relative paths resolve against the project root (not the disposable app
                workspace), so data persists across builds / watch restarts. */}
            <Infra.Sqlite filename={process.env.WEBINY_SQL_FILENAME || "./.webiny/server.sqlite"} />

            {/* Local file storage (uploaded files) + upload signing secret. Storage path resolves like
                the SQLite file — against the project root — so uploads persist across rebuilds. */}
            <Infra.FileStorage
                path={process.env.WEBINY_LOCAL_STORAGE_PATH || "./.webiny/storage"}
                uploadSecret={process.env.WEBINY_UPLOAD_SECRET || "dev-only-insecure-upload-secret"}
            />

            {/* The API's public origin. AWS derives this from stack output; the server has none, so it
                is configured here. `Admin.ApiUrl` points the admin bundle at it; `Infra.ApiUrl` tells
                the API its own origin (used for the file-upload URL + file srcPrefix). */}
            <Admin.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />
            <Infra.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />

            {/* Auth: built-in self-hosted IdP (login screen + JWT). Back the secret with any env var. */}
            <SelfHostedAuth
                signingSecret={
                    process.env.WEBINY_SELF_HOSTED_AUTH_SECRET || "dev-only-insecure-secret"
                }
            />
        </>
    );
};
