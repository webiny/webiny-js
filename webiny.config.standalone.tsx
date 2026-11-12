import React from "react";
import { Admin } from "webiny/extensions";
import { Infra } from "webiny/extensions";
import { SelfHostedAuth } from "@webiny/self-hosted-auth";

/**
 * Standalone-only extensions, rendered by webiny.config.tsx when WEBINY_HOSTING_TYPE === "standalone".
 * No Pulumi / no AWS infra here.
 */
export const StandaloneExtensions = () => {
    return (
        <>
            {/* SQL database, picked by WEBINY_DB:
                - unset: SQLite file (default)
                - "pglite": PGlite (Postgres compiled to WebAssembly), which `webiny watch` starts next to
                  the api, nothing to install
                - "postgres": a Postgres server you run, configured with WEBINY_PG_*
                Relative paths resolve against the project root (not the disposable app
                workspace), so data persists across builds/watch restarts. */}
            {process.env.WEBINY_DB === "pglite" ? (
                <Infra.Pglite
                    dataDir={process.env.WEBINY_PGLITE_DIR || "./.webiny/postgres"}
                    // Unset: the first free port from 54320. Passed only when set, as an
                    // undefined prop reaches the extension as null and fails validation.
                    {...(process.env.WEBINY_PGLITE_PORT
                        ? { port: Number(process.env.WEBINY_PGLITE_PORT) }
                        : {})}
                />
            ) : process.env.WEBINY_DB === "postgres" ? (
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
                is configured here. Admin.ApiUrl points the admin bundle at it (baked in at build
                time); Infra.ApiUrl tells the API its own origin for `webiny watch` / `webiny serve`
                (used for the file-upload URL + file srcPrefix; a deployed API reads WEBINY_API_URL
                from its environment). `Infra.AdminUrl` tells it where the admin app is served from
                (handed to websites, e.g. the Next.js starter kit).
                Without WEBINY_API_URL the admin bundle gets `/api`, resolved against the page's own
                origin: that is where `webiny watch` and `webiny serve` put the API behind their
                proxy. Set WEBINY_API_URL when building for an API on another domain, or for
                `--no-proxy`. */}
            <Admin.ApiUrl url={process.env.WEBINY_API_URL || "/api"} />
            <Infra.ApiUrl url={process.env.WEBINY_API_URL || "http://localhost:3002"} />
            <Infra.AdminUrl url={process.env.WEBINY_ADMIN_URL || "http://localhost:3001"} />

            {/* NOT required. By default the admin derives the WebSocket URL from the API URL (same
                origin, http -> ws), which is what the server flavour needs. Rendered only when
                WEBINY_ADMIN_WS_API_URL is set, for WebSockets served from a different origin: a
                fallback here would be baked into every admin build. */}
            {process.env.WEBINY_ADMIN_WS_API_URL && (
                <Admin.WebsocketsUrl url={process.env.WEBINY_ADMIN_WS_API_URL} />
            )}

            {/* Encryption and the hashing pepper are always on in a standalone API, which refuses to
                start without WEBINY_ENCRYPTION_PASSPHRASE and WEBINY_HASHING_PEPPER. These set them
                for `webiny watch` / `webiny serve`; a deployed API reads both from its environment.
                Same dev values as the AWS config. */}
            <Infra.Crypto.Encryption
                passphrase={process.env.WEBINY_ENCRYPTION_PASSPHRASE || "my-passphrase"}
            />
            <Infra.Crypto.Hashing
                pepper={process.env.WEBINY_HASHING_PEPPER || "my-hashing-pepper"}
            />

            {/* Auth: built-in self-hosted IdP (login screen + JWT). */}
            <SelfHostedAuth
                signingSecret={
                    process.env.WEBINY_SELF_HOSTED_AUTH_SECRET || "dev-only-insecure-secret"
                }
            />
        </>
    );
};
