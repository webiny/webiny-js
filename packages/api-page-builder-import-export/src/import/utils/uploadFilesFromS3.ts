import { s3Stream } from "~/export/s3Stream";
import { FileInput } from "@webiny/api-file-manager/types";

export type UploadFileMap = Map<string, FileInput>;

export async function uploadFilesFromS3(fileMap: UploadFileMap) {
    const promises = [];
    for (const [source, target] of Array.from(fileMap.entries())) {
        // Read file.
        const readStream = await s3Stream.readStream(source);

        const ws = s3Stream.writeStream(target.key, target.type);
        readStream.pipe(ws.streamPassThrough);
        promises.push(ws.streamPassThroughUploadPromise);

        console.log(`Successfully queued file "${target.key}"`);
    }

    return Promise.all(promises);
}
