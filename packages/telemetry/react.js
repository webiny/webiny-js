import baseSendEvent from "./sendEvent.js";
import { WTS } from "@webiny/wts-client/web";

const STORAGE_MACHINE_ID = "wts_machine_id";
const STORAGE_PROJECT_ID = "wts_project_id";

let wtsInstance = null;
let projectId = null;

/**
 * Resolves the WTS client identity for the admin app.
 *
 * Priority for `distinct_id` (machine_id):
 *   1. URL param `wts_did` on first load (printed by the CLI at deploy-end).
 *      Persisted to localStorage so refreshes keep working.
 *   2. localStorage (subsequent loads).
 *   3. `process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID` (build-time fallback).
 *
 * Same priority for `project_id`, read from URL param `iid`. Attached as a
 * super-property on every event so PostHog funnels can group per-install.
 */
const initWts = () => {
    if (wtsInstance) {
        return wtsInstance;
    }

    let distinctId = process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID;

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
            projectId = iidFromUrl;
            try {
                window.localStorage.setItem(STORAGE_PROJECT_ID, iidFromUrl);
            } catch {
                // ignore
            }
        } else {
            try {
                projectId = window.localStorage.getItem(STORAGE_PROJECT_ID);
            } catch {
                projectId = null;
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
    if (typeof window !== "undefined") {
        try {
            const stored = window.localStorage.getItem(STORAGE_MACHINE_ID);
            if (stored) return stored;
        } catch {
            // ignore
        }
    }
    return process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID || null;
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

    return baseSendEvent({
        event,
        properties: {
            ...properties,
            ...wcpProperties,
            ...(projectId ? { project_id: projectId } : {}),
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
