import { globalConfig } from "@webiny/global-config";
import { isCI } from "ci-info";
import { WTS } from "wts-client/node.js";
import baseSendEvent from "./sendEvent.js";
import { loadJsonFileSync } from "load-json-file";
import path from "path";

export const sendEvent = async ({ event, user, version, properties }) => {
    const shouldSend = isEnabled();
    if (!shouldSend) {
        return;
    }

    const wts = new WTS();

    const wcpProperties = {};
    const [wcpOrgId, wcpProjectId] = getWcpOrgProjectId();
    if (wcpOrgId && wcpProjectId) {
        wcpProperties.wcpOrgId = wcpOrgId;
        wcpProperties.wcpProjectId = wcpProjectId;
    }

    const packageJsonPath = path.join(import.meta.dirname, "package.json");
    const packageJson = loadJsonFileSync(packageJsonPath);

    return baseSendEvent({
        event,
        user: user || globalConfig.get("id"),
        properties: {
            ...properties,
            ...wcpProperties,
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
