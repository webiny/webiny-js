import os from "os";
import path from "path";
import readJson from "load-json-file";
import { writeJsonFileSync } from "write-json-file";
import { v4 as uuidv4 } from "uuid";

const configPath = path.join(os.homedir(), ".webiny", "config");

export class EnsureSystemWebinyConfig {
    execute() {
        // Check user ID
        try {
            const config = readJson.sync<Record<string, any>>(configPath);
            if (!config.id) {
                throw Error("Invalid Webiny config.");
            }
        } catch {
            // A new config file is written if it doesn't exist or is invalid.
            writeJsonFileSync(configPath, { id: uuidv4(), telemetry: true });
        }
    }
}
