import { dirname } from "path";
import { createWriteStream, ensureDir } from "fs-extra";
import fetch from "node-fetch";

export const downloadFile = async (url: string, file: string) => {
    const res = await fetch(url);

    await new Promise<void>(async (resolve, reject) => {
        await ensureDir(dirname(file));
        const fileStream = createWriteStream(file);
        res.body.pipe(fileStream);
        res.body.on("error", err => {
            reject(err);
        });
        fileStream.on("finish", () => {
            resolve();
        });
    });
};
