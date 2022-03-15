import { createWriteStream } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";
import fetch from "node-fetch";

const streamPipeline = promisify(pipeline);
/**
 * Download a remote file and save it onto disk.
 */
export default async function download(URL: string, path: string): Promise<void> {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`unexpected response ${response.statusText}`);
        }
        await streamPipeline(response.body, createWriteStream(path));
    } catch (e) {
        console.log(`[download]: Error while downloading ${URL}`, e);
    }
}
