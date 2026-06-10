import { globalConfig } from "@webiny/global-config";
import { isCI } from "ci-info";
import { WTS } from "@webiny/wts-client/node";
import baseSendEvent from "./sendEvent.js";
import { loadJsonFileSync } from "load-json-file";
import path from "path";

export const sendEvent = async ({ event, version, properties }) => {
    const shouldSend = isEnabled();
    if (!shouldSend) {
        return;
    }

    // Use the canonical Webiny machine id — the top-level `id` field in
    // `~/.webiny/config`, owned by @webiny/global-config. The admin app
    // (REACT_APP_WEBINY_TELEMETRY_USER_ID) and the website install/finish alias
    // both key off this same id, so passing it here keeps CLI, admin, and
    // website events on a single PostHog person. Without it, the WTS client
    // falls back to its own `user.id` field, which is a different UUID and
    // fragments funnels across surfaces.
    const wts = new WTS({ source: "cli", distinctId: globalConfig.get("id") });

    const wcpProperties = {};
    const [wcpOrgId, wcpProjectId] = getWcpOrgProjectId();
    if (wcpOrgId && wcpProjectId) {
        wcpProperties.wcpOrgId = wcpOrgId;
        wcpProperties.wcpProjectId = wcpProjectId;
    }

    const installationProperties = {};
    const installationId = getInstallationId();
    if (installationId) {
        installationProperties.installation_id = installationId;
    }

    const packageJsonPath = path.join(import.meta.dirname, "package.json");
    const packageJson = loadJsonFileSync(packageJsonPath);

    return baseSendEvent({
        event,
        properties: {
            ...properties,
            ...wcpProperties,
            ...installationProperties,
            version: version || packageJson.version,
            ci: isCI,
            newUser: Boolean(globalConfig.get("newUser"))
        },
        wts
    });
};

const getWcpOrgProjectId = () => {
    // In CLI, project ID is stored in the `WEBINY_PROJECT_ID` or `WCP_PROJECT_ID` environment variable.
    const id = process.env.WEBINY_PROJECT_ID || process.env.WCP_PROJECT_ID;
    if (typeof id === "string") {
        return id.split("/");
    }
    return [];
};

/**
 * Reads the anonymous per-project installation id from
 * `<project-root>/package.json` → `webiny.installationId`. Generated once at
 * `create-webiny-project` time and tracked in git so it stays stable across
 * machines that share the project. Returns null if the file is missing or
 * unreadable — telemetry events still fire, just without the property.
 */
const getInstallationId = () => {
    try {
        const data = loadJsonFileSync(path.join(process.cwd(), "package.json"));
        return typeof data?.webiny?.installationId === "string" ? data.webiny.installationId : null;
    } catch {
        return null;
    }
};

export const enable = () => {
    globalConfig.set("telemetry", true);
};

export const disable = () => {
    globalConfig.set("telemetry", false);
};

export const isEnabled = () => {
    const config = globalConfig.get();

    if (config.telemetry === false) {
        return false;
    }

    // `tracking` is left here for backwards compatibility with previous versions of Webiny.
    return config.tracking !== false;
};
