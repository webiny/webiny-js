import fs from "fs";
import { join } from "path";

export const copyToDist = (path, { cwd, logs, outputDir }) => {
    const from = join(cwd, path);
    const to = join(outputDir || join(cwd, "dist"), path);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        logs !== false && console.log(`Copied ${path}.`);
    }
};
