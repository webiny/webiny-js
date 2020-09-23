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
import { FileData, MappedFileData, PageData } from "@webiny/api-page-builder/types";

const FILES_COUNT_IN_EACH_BATCH = 15;

const savePageFilesData = async (
    pagesFilesData: FileData[],
    context: any,
    INSTALL_EXTRACT_DIR: string
): Promise<MappedFileData> => {
    // TODO remove when writing types for this module args
    if (!context) {
        throw new Error("There is no context when saving pages.");
    } else if (
        !context.args ||
        Array.isArray(context.args) === false ||
        context.args.length === 0
    ) {
        throw new Error("There is no context.args when saving pages.");
    }
    const [event] = context.args;
    if (!event) {
        throw new Error("There is no event property in context.args (first value in array).");
    } else if (!event.headers) {
        throw new Error("There is no headers property in context.args[0].event.");
    }

    // 2. Save files.
    // 2.1 Get pre-signed POST payloads.
    const client = new GraphQLClient(event.headers["x-webiny-apollo-gateway-url"], {
        headers: {
            Authorization: context.token
        }
    });

    // Contains all parallel file saving chunks.
    const chunksProcesses = [];

    // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
    const filesChunks = chunk<FileData>(pagesFilesData, FILES_COUNT_IN_EACH_BATCH);
    await console.log(
        `savePages: there are total of ${filesChunks.length} chunks of ${FILES_COUNT_IN_EACH_BATCH} files to save.`
    );

    for (let i = 0; i < filesChunks.length; i++) {
        chunksProcesses.push(
            new Promise(async (resolve, reject) => {
                try {
                    await console.log(`savePages: started with chunk index ${i}`);
                    const filesChunk = filesChunks[i];

                    // 1. Get pre-signed POST payloads for current files chunk.
                    const response = await client.request(UPLOAD_FILES, {
                        data: filesChunk.map(item => pick(item, ["name", "size", "type"]))
                    });

                    const preSignedPostPayloads = response?.files?.uploadFiles?.data || [];
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

                    const filesData = filesChunk.map((item, i) => {
                        return {
                            meta: item.meta,
                            ...preSignedPostPayloads[i].file,
                            id: item.id
                        };
                    });

                    console.log("savePages: saving File entries into the database...");

                    await client.request(CREATE_FILES, {
                        data: filesData
                    });

                    resolve(filesData);
                } catch (e) {
                    reject(e);
                }
            })
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

const findAndReplaceFileAttributes = (page: PageData, mappedPageFilesData: MappedFileData) => {
    const socialImageId = page?.settings?.social?.image;
    if (socialImageId) {
        page.settings.social.image = mappedPageFilesData.get(socialImageId) || null;
    }
    if (Array.isArray(page.content?.elements) === false) {
        return page;
    }
    findAndReplaceFileAttributesInElements(page.content.elements, mappedPageFilesData);
    return page;
};

const findAndReplaceFileAttributesInElements = (
    elements: any[],
    mappedPageFilesData: MappedFileData
) => {
    for (const key in elements) {
        const fileId = elements[key].data?.image?.file;
        const file = fileId ? mappedPageFilesData.get(fileId) : null;

        if (file) {
            elements[key].data.image.file = file;
        }
        if (Array.isArray(elements[key].elements)) {
            findAndReplaceFileAttributesInElements(elements[key].elements, mappedPageFilesData);
        }
    }
};

const savePagesData = async (
    pagesData: PageData[],
    context: any,
    mappedPageFilesData: Map<string, FileData>
) => {
    const { PbPage } = context.models;

    const savingInstancesProcess = [];
    for (let i = 0; i < pagesData.length; i++) {
        savingInstancesProcess.push(
            new Promise(async (resolve, reject) => {
                try {
                    const existing = await PbPage.findOne({
                        query: {
                            id: pagesData[i].id,
                            deleted: { $in: [true, false] }
                        }
                    });

                    if (existing) {
                        resolve();
                        return;
                    }

                    const pageData = findAndReplaceFileAttributes(
                        pagesData[i],
                        mappedPageFilesData
                    );

                    const instance = new PbPage();
                    instance.populate(pageData);
                    await instance.save();

                    // "published" can only be changed after the initial entity is saved.
                    instance.published = true;
                    await instance.save();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            })
        );
    }
    const result = await Promise.all(savingInstancesProcess);

    console.log("savePages: PbPage instances saved successfully.");

    return result;
};

export default async ({ context, INSTALL_EXTRACT_DIR }) => {
    const pagesData: PageData[] = await loadJson(
        path.join(INSTALL_EXTRACT_DIR, "data/pagesData.json")
    );
    const pagesFilesData: FileData[] = await loadJson(
        path.join(INSTALL_EXTRACT_DIR, "data/pagesFilesData.json")
    );

    try {
        await console.log("savePages: moving on to file uploads...");

        const savedFilesDataResult = await savePageFilesData(
            pagesFilesData,
            context,
            INSTALL_EXTRACT_DIR
        );

        console.log("Saved files.... ");

        const result = await savePagesData(pagesData, context, savedFilesDataResult);

        console.log(`Saved total of ${result.length} pages.`);

        return result;
    } catch (e) {
        return await console.log(`savePages: error occurred: ${e.stack}`);
    }
};
