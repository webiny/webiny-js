import findUp from "find-up";
import readJsonSync from "read-json-sync";
// @ts-ignore TODO: convert `global-config` package to TS
import { globalConfig } from "@webiny/global-config";
import { useWebiny } from "../../webiny";

/**
 * Apply default environment variables.
 */
export const applyDefaults = () => {
    const webiny = useWebiny();

    if (!("REACT_APP_USER_ID" in process.env)) {
        process.env.REACT_APP_USER_ID = globalConfig.get("id");
    }

    if (!("REACT_APP_WEBINY_TELEMETRY" in process.env)) {
        process.env.REACT_APP_WEBINY_TELEMETRY = String(webiny.telemetry);
    }

    if (!("INLINE_RUNTIME_CHUNK" in process.env)) {
        process.env.INLINE_RUNTIME_CHUNK = "true";
    }

    if (!("REACT_APP_WEBINY_VERSION" in process.env)) {
        const pkg = readJsonSync(findUp.sync("package.json") as string);
        process.env.REACT_APP_WEBINY_VERSION = pkg.version;
    }
};
