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

const FILES_COUNT_IN_EACH_BATCH = 15;

export default async ({ context, INSTALL_EXTRACT_DIR }) => {
    const elementsData = await loadJson(path.join(INSTALL_EXTRACT_DIR, "data/elementsData.json"));
    const elementsFilesData = await loadJson(
        path.join(INSTALL_EXTRACT_DIR, "data/elementsFilesData.json")
    );

    try {
        const { PbPageElement } = context.models;

        // 1. Save page elements.
        const savingInstancesProcess = [];
        for (let i = 0; i < elementsData.length; i++) {
            savingInstancesProcess.push(
                // eslint-disable-next-line
                new Promise(async (resolve, reject) => {
                    try {
                        const existing = await PbPageElement.findOne({
                            query: {
                                id: elementsData.id,
                                deleted: { $in: [true, false] }
                            }
                        });

                        if (existing) {
                            resolve();
                            return;
                        }

                        const instance = new PbPageElement();
                        await instance.populate(elementsData[i]).save();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                })
            );
        }

        await Promise.all(savingInstancesProcess);

        await console.log("saveElements: PbPageElement instances saved successfully.");

        await console.log("saveElements: moving on to file uploads...");

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
        const filesChunks = chunk(elementsFilesData, FILES_COUNT_IN_EACH_BATCH);
        await console.log(
            `saveElements: there are total of ${filesChunks.length} chunks of ${FILES_COUNT_IN_EACH_BATCH} files to save.`
        );

        for (let i = 0; i < filesChunks.length; i++) {
            chunksProcesses.push(
                // eslint-disable-next-line
                new Promise(async (promise, reject) => {
                    try {
                        await console.log(`saveElements: started with chunk index ${i}`);
                        let filesChunk = filesChunks[i];

                        // 1. Get pre-signed POST payloads for current files chunk.
                        const response = await client.request(UPLOAD_FILES, {
                            data: filesChunk.map(item => pick(item, ["name", "size", "type"]))
                        });

                        const preSignedPostPayloads =
                            get(response, "files.uploadFiles.data.data") || [];
                        await console.log(
                            `saveElements: received pre-signed POST payloads for ${preSignedPostPayloads.length} files.`
                        );

                        // 2. Use received pre-signed POST payloads to upload files directly to S3.
                        const s3UploadProcess = [];
                        for (let j = 0; j < filesChunk.length; j++) {
                            const currentFile = filesChunk[j];
                            const buffer = fs.readFileSync(
                                path.join(
                                    INSTALL_EXTRACT_DIR,
                                    "images/elements/images/",
                                    currentFile.__physicalFileName
                                )
                            );

                            s3UploadProcess.push(uploadToS3(buffer, preSignedPostPayloads[j].data));
                        }

                        await Promise.all(s3UploadProcess);

                        // 3. Now that all of the files were successfully uploaded, we create files entries in the database.
                        await console.log("saveElements: saving File entries into the database...");
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

            await sleep(750);
        }

        return Promise.all(chunksProcesses);
    } catch (e) {
        return await console.log(`saveElements: error occurred: ${e.stack}`);
    }
};
