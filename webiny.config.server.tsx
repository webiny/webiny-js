import React from "react";
import { Admin } from "webiny/extensions";
// Server-only namespaces come from the server flavour package (webiny/extensions currently exposes
// the AWS namespaces, which don't include server-only extensions like Infra.Sqlite).
import { Infra } from "@webiny/project-server";
import { SelfHostedAuth } from "@webiny/self-hosted-auth";

/**
 * Server-only (self-hosted) extensions, rendered by webiny.config.tsx when WEBINY_HOSTING_TYPE === "server".
 * No Pulumi / no AWS infra here.
 */
export const ServerExtensions = () => {
    return (
        <>
            {/* SQL database. Relative paths resolve against the project root (not the disposable app
                workspace), so data persists across builds/watch restarts. */}
            {process.env.WEBINY_DB === "postgres" ? (
                <Infra.Postgres
                    host={process.env.WEBINY_PG_HOST || "localhost"}
                    port={Number(process.env.WEBINY_PG_PORT) || 5432}
                    user={process.env.WEBINY_PG_USER || "postgres"}
                    password={process.env.WEBINY_PG_PASSWORD || "webiny"}
                    database={process.env.WEBINY_PG_DATABASE || "webiny"}
                />
            ) : (
                <Infra.Sqlite
                    filename={process.env.WEBINY_SQL_FILENAME || "./.webiny/server.sqlite"}
                />
            )}

            {/* Local file storage (uploaded files) + upload signing secret. Storage path resolves like
                the SQLite file — against the project root — so uploads persist across rebuilds. */}
            <Infra.FileStorage
                path={process.env.WEBINY_LOCAL_STORAGE_PATH || "./.webiny/storage"}
                uploadSecret={process.env.WEBINY_UPLOAD_SECRET || "dev-only-insecure-upload-secret"}
            />

            {/* The API's public origin. AWS derives this from stack output; the server has none, so it
                is configured here (build-time env is fine — this is config, not api runtime code) and
                consumed via BuildParams. Admin.ApiUrl points the admin bundle at it; Infra.ApiUrl tells
                the API its own origin (used for the file-upload URL + file srcPrefix). */}
            <Admin.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />
            <Infra.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />

            {/* NOT required — shown here for visibility/demo only. By default the admin derives the
                WebSocket URL from the API URL (same origin, http -> ws), which is what the server
                flavour needs. Set this only when WebSockets are served from a different origin. */}
            <Admin.WebsocketsUrl
                url={process.env.WEBINY_ADMIN_WS_API_URL || "ws://localhost:3002"}
            />

            {/* Auth: built-in self-hosted IdP (login screen + JWT). Back the secret with any env var. */}
            <SelfHostedAuth
                signingSecret={
                    process.env.WEBINY_SELF_HOSTED_AUTH_SECRET || "dev-only-insecure-secret"
                }
            />
        </>
    );
};
