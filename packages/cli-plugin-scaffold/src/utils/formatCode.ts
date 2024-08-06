import fs from "fs";
import path from "path";
import glob from "fast-glob";
import prettier from "prettier";

const globDefaultOptions = {
    cwd: process.cwd(),
    onlyFiles: true,
    ignore: ["**/node_modules/**"]
};

export default async (
    globPattern: Parameters<typeof glob.sync>[0],
    options: Parameters<typeof glob.sync>[1]
): Promise<void> => {
    const globOptions = {
        ...globDefaultOptions,
        ...options
    };

    const filePaths = glob.sync(globPattern, globOptions);

    for (let i = 0; i < filePaths.length; i++) {
        const filePath = path.join(globOptions.cwd, filePaths[i]);

        const options = await prettier.resolveConfig(filePath);
        const fileContentRaw = fs.readFileSync(filePath).toString("utf8");
        const fileContentFormatted = await prettier.format(fileContentRaw, {
            ...options,
            filepath: filePath
        });
        fs.writeFileSync(filePath, fileContentFormatted);
    }
};
