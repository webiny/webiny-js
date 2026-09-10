import React from "react";
import { Admin } from "webiny/extensions";
// Server-only namespaces come from the server hosting-type package. `webiny/extensions` exposes the
// AWS namespaces, which don't include server-only extensions like `Infra.Postgres`.
import { Infra } from "@webiny/project-server";
import { SelfHostedAuth } from "@webiny/self-hosted-auth";

/**
 * Self-hosted (server) hosting-type project extensions. No AWS, no Pulumi, no `deploy` — a single
 * long-running Node HTTP server backed by SQL storage. Run it with `yarn webiny watch`.
 */
export const Extensions = () => {
    return (
        <>
            {/* SQL database — connect to a Postgres server. Connection params come from the WEBINY_PG_*
                env vars (see `.env`); set `ssl` when connecting to a managed Postgres that requires it. */}
            <Infra.Postgres
                host={process.env.WEBINY_PG_HOST || "localhost"}
                port={Number(process.env.WEBINY_PG_PORT) || 5432}
                user={process.env.WEBINY_PG_USER || "postgres"}
                password={process.env.WEBINY_PG_PASSWORD || "postgres"}
                database={process.env.WEBINY_PG_DATABASE || "webiny"}
            />

            {/* Local file storage (uploaded files) + upload signing secret. Storage path resolves
                against the project root, so uploads persist across rebuilds. */}
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
