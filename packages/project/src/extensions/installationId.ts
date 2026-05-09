import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reads the anonymous per-project installation id from
 * `<project-root>/webiny.installation.json` (relative to `process.cwd()`).
 *
 * The file is generated once at `create-webiny-project` time and tracked in
 * git, so this id is stable across machines that share the same Webiny
 * project. Used by the build step to expose `REACT_APP_WEBINY_INSTALLATION_ID`
 * to the admin bundle.
 *
 * Returns null if the file is missing or unreadable — builds proceed without
 * the env var; telemetry events fire without the `installation_id` property.
 */
export function readInstallationId(): string | null {
    try {
        const path = join(process.cwd(), "webiny.installation.json");
        if (!existsSync(path)) return null;
        const data = JSON.parse(readFileSync(path, "utf8"));
        return typeof data?.installationId === "string" ? data.installationId : null;
    } catch {
        return null;
    }
}
