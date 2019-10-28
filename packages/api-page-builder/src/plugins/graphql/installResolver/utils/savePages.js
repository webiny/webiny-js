import get from "lodash.get";
import pick from "lodash.pick";
import { CREATE_FILES, UPLOAD_FILES } from "./graphql";
import { GraphQLClient } from "graphql-request";
import fs from "fs-extra";
import path from "path";
import uploadToS3 from "./uploadToS3";
import sleep from "./sleep";
import chunk from "lodash.chunk";
const loadJson = require("load-json-file");

const FILES_COUNT_IN_EACH_BATCH = 7;

export default async ({ context, INSTALL_EXTRACT_DIR }) => {
    const pagesData = await loadJson(path.join(INSTALL_EXTRACT_DIR, "data/pagesData.json"));
    const pagesFilesData = await loadJson(path.join(INSTALL_EXTRACT_DIR, "data/pagesFilesData.json"));

    try {
        const { PbPage } = context.models;

        // 1. Save page pages.
        const savingInstancesProcess = [];
        for (let i = 0; i < pagesData.length; i++) {
            const instance = new PbPage();
            savingInstancesProcess.push(instance.populate(pagesData[i]).save());
        }

        await Promise.all(savingInstancesProcess);

        await console.log("savePages: PbPage instances saved successfully.");

        await console.log("savePages: moving on to file uploads...");

        // 2. Save files.
        // 2.1 Get pre-signed POST payloads.
        const client = new GraphQLClient(process.env.FILES_API_URL, {
            headers: {
                Authorization: context.token
            }
        });

        // Contains all parallel file saving chunks.
        const chunksProcesses = [];

        // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
        const filesChunks = chunk(pagesFilesData, FILES_COUNT_IN_EACH_BATCH);
        await console.log(
            `savePages: there are total of ${filesChunks.length} chunks of 5 files to save.`
        );

        for (let i = 0; i < filesChunks.length; i++) {
            chunksProcesses.push(
                // eslint-disable-next-line
                new Promise(async (promise, reject) => {
                    try {
                        await console.log(`savePages: started with chunk index ${i}`);
                        let filesChunk = filesChunks[i];

                        // 1. Get pre-signed POST payloads for current files chunk.
                        const response = await client.request(UPLOAD_FILES, {
                            data: filesChunk.map(item => pick(item, ["name", "size", "type"]))
                        });

                        const preSignedPostPayloads =
                            get(response, "files.uploadFiles.data.data") || [];
                        await console.log(
                            `savePages: received pre-signed POST payloads for ${preSignedPostPayloads.length} files.`
                        );

                        // 2. Use received pre-signed POST payloads to upload files directly to S3.
                        const s3UploadProcess = [];
                        for (let j = 0; j < filesChunk.length; j++) {
                            const currentFile = filesChunk[j];
                            const buffer = fs.readFileSync(
                                path.join(
                                    INSTALL_EXTRACT_DIR,
                                    "images/pages/images/",
                                    currentFile.__physicalFileName
                                )
                            );

                            s3UploadProcess.push(uploadToS3(buffer, preSignedPostPayloads[j].data));
                        }

                        await Promise.all(s3UploadProcess);

                        // 3. Now that all of the files were successfully uploaded, we create files entries in the database.
                        await console.log("savePages: saving File entries into the database...");
                        await client.request(CREATE_FILES, {
                            data: filesChunk.map((item, i) => {
                                return {
                                    meta: item.meta,
                                    ...preSignedPostPayloads[i].file,
                                    id: item.id
                                };
                            })
                        });

                        promise();
                    } catch (e) {
                        reject(e);
                    }
                })
            );

            await sleep(300);
        }

        return Promise.all(chunksProcesses);
    } catch (e) {
        return await console.log(`savePages: error occurred: ${e.stack}`);
    }
};
