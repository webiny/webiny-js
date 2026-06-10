import os from "os";
import path from "path";
import { uuid as uuidv4 } from "@webiny/stdlib";
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
                id: uuidv4(),
                telemetry: true,

                // This flag is set to `false` the moment user successfully
                // deploys a Webiny project for the first time. Once they do,
                // they're considered no longer a "new user".
                // Also, in CI environments, we always set this to `false`.
                newUser: isCI ? false : true
            };
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
