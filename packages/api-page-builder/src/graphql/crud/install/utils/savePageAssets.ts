import chunk from "lodash/chunk";
import loadJson from "load-json-file";
import fs from "fs-extra";
import path from "path";
import sleep from "./sleep";
import downloadInstallationFiles from "./downloadInstallFiles";

const FILES_COUNT_IN_EACH_BATCH = 15;

export default async ({ context }) => {
    /**
     * This function contains logic of file download from S3.
     * Current we're not mocking zip file download from S3 in tests at the moment.
     * So, we're manually mocking it in case of test just by returning an empty object.
     */
    if (process.env.NODE_ENV === "test") {
        return {};
    }

    const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();

    const pagesFilesData = await loadJson<Record<string, any>[]>(
        path.join(INSTALL_EXTRACT_DIR, "data/pagesFilesData.json")
    );

    try {
        // Save uploaded file key against static id for later use.
        const fileIdToKeyMap = {};
        // Contains all parallel file saving chunks.
        const chunksProcesses = [];

        // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
        const filesChunks = chunk(pagesFilesData, FILES_COUNT_IN_EACH_BATCH);

        for (let i = 0; i < filesChunks.length; i++) {
            chunksProcesses.push(
                // eslint-disable-next-line
                new Promise(async (promise, reject) => {
                    try {
                        const filesChunk = filesChunks[i];

                        // 2. Use received pre-signed POST payloads to upload files directly to S3.
                        const s3UploadProcess = [];
                        for (let j = 0; j < filesChunk.length; j++) {
                            const currentFile = filesChunk[j];
                            // Initialize the value
                            fileIdToKeyMap[currentFile.id] = currentFile.type;
                            try {
                                const buffer = fs.readFileSync(
                                    path.join(
                                        INSTALL_EXTRACT_DIR,
                                        "images/",
                                        currentFile.__physicalFileName
                                    )
                                );

                                s3UploadProcess.push(
                                    // Upload file to file manager via S3
                                    context.fileManager.storage.upload({
                                        buffer,
                                        size: buffer.length,
                                        name: currentFile.name,
                                        type: currentFile.type,
                                        keyPrefix: "welcome-to-webiny-page",
                                        hideInFileManager: Boolean(currentFile.meta.private)
                                    })
                                );
                            } catch (e) {
                                console.log("Error while uploading file: ", currentFile.name);
                                console.log(e);
                                /**
                                 * In case of error he still had a fake key so that we get same number of results as files chunk.
                                 */
                                s3UploadProcess.push({ key: currentFile.key + "/not-found" });
                            }
                        }

                        const fileUploadResults = await Promise.all(s3UploadProcess);
                        // Save File key against static ID
                        fileUploadResults.forEach((item, index) => {
                            fileIdToKeyMap[filesChunk[index].id] = item.key;
                        });

                        // @ts-ignore
                        promise(fileUploadResults);
                    } catch (e) {
                        reject(e);
                    }
                })
            );

            await sleep(750);
        }

        await Promise.all(chunksProcesses);
        return fileIdToKeyMap;
    } catch (e) {
        return console.log(`[savePageAssets]: error occurred: ${e.stack}`);
    }
};
