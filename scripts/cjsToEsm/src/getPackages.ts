import fs from "fs";
import path from "path";

const defaultExclude = [
    "cli-plugin-dependencies",
    "cli",
    "create-webiny-project",
    "cwp-template-aws"
];

export const getPackages = (exclude: string[] = defaultExclude) => {
    return fs
        .readdirSync(process.cwd() + "/packages", { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !exclude.includes(dirent.name))
        .map(dirent => path.join(dirent.parentPath, dirent.name));
};
