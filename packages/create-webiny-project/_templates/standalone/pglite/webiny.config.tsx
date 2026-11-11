import React from "react";
import { Admin } from "webiny/extensions";
// Server-only namespaces come from the standalone hosting-type package. `webiny/extensions` exposes the
// AWS namespaces, which don't include server-only extensions like `Infra.Pglite`.
import { Infra } from "@webiny/project-standalone";
import { SelfHostedAuth } from "@webiny/self-hosted-auth";

/**
 * Standalone hosting-type project extensions. No AWS, no Pulumi, no `deploy` — a single
 * long-running Node HTTP server backed by SQL storage. Run it with `yarn webiny watch`.
 */
export const Extensions = () => {
    return (
        <>
            {/* Database: PGlite (Postgres compiled to WebAssembly), which `webiny watch` starts next to the api — nothing to
                install. Data is kept in `dataDir` (relative to the project root), so it survives
                restarts. Content uses the Postgres-native storage. For production, switch to
                <Infra.Postgres ... /> pointing at a real Postgres server. */}
            <Infra.Pglite dataDir="./.webiny/postgres" />

            {/* Local file storage (uploaded files) + upload signing secret. Storage path resolves
                against the project root, so uploads persist across rebuilds. */}
            <Infra.FileStorage
                path={process.env.WEBINY_LOCAL_STORAGE_PATH || "./.webiny/storage"}
                uploadSecret={process.env.WEBINY_UPLOAD_SECRET || "dev-only-insecure-upload-secret"}
            />

            {/* The API's public origin. AWS derives this from stack output; the server has none, so it
                is configured here. `Admin.ApiUrl` points the admin bundle at it; `Infra.ApiUrl` tells
                the API its own origin (used for the file-upload URL + file srcPrefix).
                `Infra.AdminUrl` tells it where the admin app is served from (handed to websites, e.g.
                the Next.js starter kit). */}
            <Admin.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />
            <Infra.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />
            <Infra.AdminUrl url={process.env.WEBINY_ADMIN_URL || "http://localhost:3001"} />

            {/* Auth: built-in self-hosted IdP (login screen + JWT). Back the secret with any env var. */}
            <SelfHostedAuth
                signingSecret={
                    process.env.WEBINY_SELF_HOSTED_AUTH_SECRET || "dev-only-insecure-secret"
                }
            />
        </>
    );
};
