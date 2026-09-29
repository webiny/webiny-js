import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { loadJsonFileSync } from "load-json-file";
import { writeJsonFileSync } from "write-json-file";
import { isCI } from "ci-info";

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), ".webiny", "config");

export const globalConfig = {
    __globalConfig: null,
    get(key) {
        try {
            if (!this.__globalConfig) {
                this.__globalConfig = loadJsonFileSync(GLOBAL_CONFIG_PATH);
                if (!this.__globalConfig.id) {
                    throw Error("Invalid Webiny config!");
                }
            }
        } catch {
            // A new config file is written if it doesn't exist or is invalid.
            this.__globalConfig = {
                // Node's own v4 UUID. This used to come from `@webiny/stdlib`, whose root entry is
                // about 30 modules, loaded on every CLI command just to generate this one ID.
                id: randomUUID(),
                telemetry: true,

                // This flag is set to `false` the moment user successfully
                // deploys a Webiny project for the first time. Once they do,
                // they're considered no longer a "new user".
                // Also, in CI environments, we always set this to `false`.
                newUser: isCI ? false : true
            };
            writeJsonFileSync(GLOBAL_CONFIG_PATH, this.__globalConfig);
        }

        // Backfill `newUser` on configs that predate it, or that were written by something
        // that didn't set it. Absent is not the same as `false`: the only thing that writes
        // `false` is the first successful deploy, so a missing key means that never happened
        // and the user is still new. Reading it as `Boolean(undefined)` reported every one of
        // them as returning. Persisted so the state stops being ambiguous, and so every reader
        // agrees without repeating this rule.
        if (!("newUser" in this.__globalConfig)) {
            this.__globalConfig.newUser = isCI ? false : true;
            writeJsonFileSync(GLOBAL_CONFIG_PATH, this.__globalConfig);
        }

        return key ? this.__globalConfig[key] : this.__globalConfig;
    },
    set(key, value) {
        const globalConfig = this.get();
        globalConfig[key] = value;
        writeJsonFileSync(GLOBAL_CONFIG_PATH, globalConfig);
        return globalConfig;
    }
};
