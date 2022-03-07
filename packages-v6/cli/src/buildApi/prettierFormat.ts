import fs from "fs";
import prettier from "prettier";

export const prettierFormat = async (files: string[]) => {
    for (const file of files) {
        const options = await prettier.resolveConfig(file);
        const fileContentRaw = fs.readFileSync(file).toString("utf8");
        const fileContentFormatted = prettier.format(fileContentRaw, {
            ...options,
            filepath: file
        });
        fs.writeFileSync(file, fileContentFormatted);
    }
};
