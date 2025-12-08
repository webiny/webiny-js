import type { WcpProjectEnvironment } from "./types.js";
import { decrypt } from "./encryption.js";

export function getWcpProjectEnvironment(): WcpProjectEnvironment | null {
    if (process.env.WCP_PROJECT_ENVIRONMENT) {
        try {
            return decrypt<WcpProjectEnvironment>(process.env.WCP_PROJECT_ENVIRONMENT);
        } catch {
            throw new Error("Could not decrypt WCP_PROJECT_ENVIRONMENT environment variable data.");
        }
    }
    return null;
}
