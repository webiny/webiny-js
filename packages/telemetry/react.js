import baseSendEvent from "./sendEvent.js";
import { WTS } from "@webiny/wts-client/web";

const STORAGE_MACHINE_ID = "wts_machine_id";
// Storage key kept as-is: ids persisted by earlier versions still live under it, and renaming the
// key would silently mint a new installation id for every existing admin session.
const STORAGE_INSTALLATION_ID = "wts_project_id";

let wtsInstance = null;
let installationId = null;
let distinctId = null;

/**
 * Resolves the WTS client identity for the admin app.
 *
 * Priority for `distinct_id` (machine_id):
 *   1. URL param `wts_did` on first load. Persisted to localStorage.
 *   2. localStorage (subsequent loads).
 *   3. `process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID` (build-time fallback,
 *      set by `SetAdminAppEnvVarsBefore{Build,Watch}` from `~/.webiny/config`).
 *
 * Priority for `installation_id`:
 *   1. URL param `iid` on first load. Persisted to localStorage.
 *   2. localStorage.
 *   3. `process.env.REACT_APP_WEBINY_INSTALLATION_ID` (build-time fallback,
 *      set from `<project>/package.json` → `webiny.installationId`).
 *
 * Attached as a super-property on every admin event so PostHog funnels can
 * group per-install. The property name matches the one the CLI sends
 * (`telemetry/cli.js`) so CLI and admin events for the same project join on a
 * single property.
 */
const initWts = () => {
    if (wtsInstance) {
        return wtsInstance;
    }

    distinctId = process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID;
    installationId = process.env.REACT_APP_WEBINY_INSTALLATION_ID || null;

    if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);

        const fromUrl = params.get("wts_did");
        if (fromUrl) {
            distinctId = fromUrl;
            try {
                window.localStorage.setItem(STORAGE_MACHINE_ID, fromUrl);
            } catch {
                // localStorage unavailable; URL value is used for this session only.
            }
        } else {
            try {
                distinctId = window.localStorage.getItem(STORAGE_MACHINE_ID) || distinctId;
            } catch {
                // ignore
            }
        }

        const iidFromUrl = params.get("iid");
        if (iidFromUrl) {
            installationId = iidFromUrl;
            try {
                window.localStorage.setItem(STORAGE_INSTALLATION_ID, iidFromUrl);
            } catch {
                // ignore
            }
        } else {
            try {
                installationId =
                    window.localStorage.getItem(STORAGE_INSTALLATION_ID) || installationId;
            } catch {
                // env-var value (set above) is used as fallback.
            }
        }
    }

    wtsInstance = new WTS({ source: "admin", distinctId });
    return wtsInstance;
};

/**
 * Returns the machine_id used by admin events, if known. Used by the
 * install/finish CTA to construct the alias handoff URL.
 */
export const getMachineId = () => {
    initWts();
    return distinctId || null;
};

export const sendEvent = async (event, properties = {}) => {
    const shouldSend = process.env.REACT_APP_WEBINY_TELEMETRY !== "false";
    if (!shouldSend) {
        return;
    }

    const wts = initWts();

    const wcpProperties = {};
    const [wcpOrgId, wcpProjectId] = getWcpOrgProjectId();
    if (wcpOrgId && wcpProjectId) {
        wcpProperties.wcpOrgId = wcpOrgId;
        wcpProperties.wcpProjectId = wcpProjectId;
    }

    const installationProperties = {};
    if (installationId) {
        installationProperties.installation_id = installationId;
    }

    const hostingTypeProperties = {};
    if (process.env.REACT_APP_WEBINY_HOSTING_TYPE) {
        hostingTypeProperties.hostingType = process.env.REACT_APP_WEBINY_HOSTING_TYPE;
    }

    return baseSendEvent({
        event,
        properties: {
            ...properties,
            ...wcpProperties,
            ...installationProperties,
            ...hostingTypeProperties,
            version: process.env.REACT_APP_WEBINY_VERSION,
            ci: process.env.REACT_APP_IS_CI === "true",
            newUser: process.env.REACT_APP_WEBINY_TELEMETRY_NEW_USER === "true"
        },
        wts
    });
};

const getWcpOrgProjectId = () => {
    // In React applications, project ID is stored in the `REACT_APP_WEBINY_PROJECT_ID` or `REACT_APP_WCP_PROJECT_ID` environment variable.
    const id = process.env.REACT_APP_WEBINY_PROJECT_ID || process.env.REACT_APP_WCP_PROJECT_ID;
    if (typeof id === "string") {
        return id.split("/");
    }
    return [];
};
