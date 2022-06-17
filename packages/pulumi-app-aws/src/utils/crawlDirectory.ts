import * as fs from "fs";

export const crawlDirectory = (dir: string, callback: (filePath: string) => void) => {
    if (!fs.existsSync(dir)) {
        return;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            crawlDirectory(filePath, callback);
        }
        if (stat.isFile()) {
            callback(filePath);
        }
    }
};
