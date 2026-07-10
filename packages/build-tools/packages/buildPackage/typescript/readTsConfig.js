import fs from "node:fs";
import stripJsonComments from "strip-json-comments";

export function readTsConfig(configPath) {
    const content = fs.readFileSync(configPath, "utf8");
    const stripped = stripJsonComments(content, { trailingCommas: true });
    return JSON.parse(stripped);
}
