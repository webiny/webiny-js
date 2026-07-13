import { join } from "node:path";
import fs from "node:fs";
import { randomBytes } from "node:crypto";

export function writeTempTsConfig(cwd, config) {
    const suffix = randomBytes(4).toString("hex");
    const tempPath = join(cwd, `tsconfig.build.tmp-${suffix}.json`);
    fs.writeFileSync(tempPath, JSON.stringify(config, null, 2), "utf8");
    return tempPath;
}
