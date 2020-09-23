/* eslint no-console: 0 */
import pick from "lodash.pick";
import { CREATE_FILES, UPLOAD_FILES } from "./graphql";
import { GraphQLClient } from "graphql-request";
import fs from "fs-extra";
import path from "path";
import uploadToS3 from "./uploadToS3";
import sleep from "./sleep";
import { chunk } from "lodash";
import loadJson from "load-json-file";
import { ElementData, FileData } from "@webiny/api-page-builder/types";

const FILES_COUNT_IN_EACH_BATCH = 15;

const saveElementsFilesData = async (
    elementsFilesData: FileData[],
    context: any,
    INSTALL_EXTRACT_DIR: string
): Promise<Map<string, FileData>> => {
    // TODO remove when writing types for this module args
    if (!context) {
        throw new Error("There is no context when saving elements.");
    } else if (
        !context.args ||
        Array.isArray(context.args) === false ||
        context.args.length === 0
    ) {
        throw new Error("There is no context.args when saving elements.");
    }
    const [event] = context.args;
    if (!event) {
        throw new Error("There is no event property in context.args (first value in array).");
    } else if (!event.headers) {
        throw new Error("There is no headers property in context.args[0].event.");
    }

    const client = new GraphQLClient(event.headers["x-webiny-apollo-gateway-url"], {
        headers: {
            Authorization: context.token
        }
    });

    // Contains all parallel file saving chunks.
    const chunksProcesses: Promise<FileData[]>[] = [];

    // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
    const filesChunks = chunk<FileData>(elementsFilesData, FILES_COUNT_IN_EACH_BATCH);
    await console.log(
        `saveElements: there are total of ${filesChunks.length} chunks of ${FILES_COUNT_IN_EACH_BATCH} files to save.`
    );

    for (let i = 0; i < filesChunks.length; i++) {
        chunksProcesses.push(
            new Promise(
                async (resolve: (files: FileData[]) => void, reject: (err: Error) => void) => {
                    try {
                        await console.log(`saveElements: started with chunk index ${i}`);
                        const filesChunk = filesChunks[i];

                        // 1. Get pre-signed POST payloads for current files chunk.
                        const response = await client.request(UPLOAD_FILES, {
                            data: filesChunk.map(item => pick(item, ["name", "size", "type"]))
                        });

                        const preSignedPostPayloads = response?.files?.uploadFiles?.data || [];
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
                        console.log("saveElements: saving File entries into the database...");

                        const filesData = filesChunk.map((item, i) => {
                            return {
                                meta: item.meta,
                                ...preSignedPostPayloads[i].file,
                                id: item.id
                            };
                        });
                        const result = await client.request(CREATE_FILES, {
                            data: filesData
                        });

                        const error = result?.files?.createFiles?.error;
                        if (error && error?.message) {
                            reject(error.message);
                        }

                        resolve(filesData);
                    } catch (e) {
                        reject(e);
                    }
                }
            )
        );

        await sleep(750);
    }
    const allSavedFileChunks = await Promise.all(chunksProcesses);

    const mappedFileData = new Map<string, FileData>();
    for (const files of allSavedFileChunks) {
        for (const file of files) {
            mappedFileData.set(file.id, file);
        }
    }
    return mappedFileData;
};

const saveElementsData = async (
    elementsData: ElementData[],
    context: any,
    mappedElementsFilesData: Map<string, FileData>
) => {
    const { PbPageElement } = context.models;

    const savingInstancesProcess = [];
    for (let i = 0; i < elementsData.length; i++) {
        savingInstancesProcess.push(
            // eslint-disable-next-line
            new Promise(async (resolve, reject) => {
                try {
                    const existing = await PbPageElement.findOne({
                        query: {
                            id: elementsData[i].id,
                            deleted: { $in: [true, false] }
                        }
                    });

                    if (existing) {
                        resolve();
                        return;
                    }

                    const { preview: previewId, ...elementData } = elementsData[i];
                    const preview = mappedElementsFilesData.get(previewId) || null;

                    const instance = new PbPageElement();
                    instance.populate({
                        ...elementData,
                        preview
                    });
                    await instance.save();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            })
        );
    }

    const results = await Promise.all(savingInstancesProcess);

    console.log("saveElements: PbPageElement instances saved successfully.");

    return results;
};

// TODO can use cleanup and a bit of refactor at some point
export default async ({ context, INSTALL_EXTRACT_DIR }) => {
    const elementsData: ElementData[] = await loadJson(
        path.join(INSTALL_EXTRACT_DIR, "data/elementsData.json")
    );
    const elementsFilesData: FileData[] = await loadJson(
        path.join(INSTALL_EXTRACT_DIR, "data/elementsFilesData.json")
    );

    // TODO need to save files first and then elements
    try {
        const savedFilesDataResult = await saveElementsFilesData(
            elementsFilesData,
            context,
            INSTALL_EXTRACT_DIR
        );

        console.log("saveElements: moving on to file uploads...");

        return await saveElementsData(elementsData, context, savedFilesDataResult);
    } catch (e) {
        console.log(`saveElements: error occurred: ${e.stack}`);
        return e;
    }
};
