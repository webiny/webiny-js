import { dirname } from "path";
import fs from "fs-extra";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";

export const downloadFile = async (url: string, file: string) => {
    const res = await fetch(url);
    
    if (!res.body) {
        throw new Error("Response body is null");
    }
    
    const nodeStream = Readable.fromWeb(res.body as NodeReadableStream);
    
    await fs.ensureDir(dirname(file));
    
    await new Promise<void>((resolve, reject) => {
        const fileStream = fs.createWriteStream(file);
        nodeStream.pipe(fileStream);
        nodeStream.on("error", (err: Error) => {
            reject(err);
        });
        fileStream.on("finish", () => {
            resolve();
        });
    });
};
