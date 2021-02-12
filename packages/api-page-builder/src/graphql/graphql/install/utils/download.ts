import fs from "fs";
import util from "util";
import fetch from "node-fetch";

const streamPipeline = util.promisify(require("stream").pipeline);
/**
 * Download a remote file and save it onto disk.
 * @param {String} URL
 * @param {String} path
 */
export default async function download(URL: string, path: string) {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`unexpected response ${response.statusText}`);
        }
        await streamPipeline(response.body, fs.createWriteStream(path));
    } catch (e) {
        console.log(`[download]: Error while downloading ${URL}`, e);
    }
}
