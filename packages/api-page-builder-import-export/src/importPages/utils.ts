import uniqueId from "uniqid";
import S3 from "aws-sdk/clients/s3";
import dotProp from "dot-prop-immutable";
import { createWriteStream } from "fs";
import { ensureDirSync } from "fs-extra";
import { promisify } from "util";
import { pipeline } from "stream";
import fetch from "node-fetch";
import path from "path";
import yauzl from "yauzl";
import chunk from "lodash/chunk";
import loadJson from "load-json-file";
import { FileInput } from "@webiny/api-file-manager/types";
import WebinyError from "@webiny/error";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { PageImportExportTaskStatus } from "~/types";
import { PbPageImportExportContext } from "~/graphql/types";
import { s3Stream } from "~/exportPages/s3Stream";

const streamPipeline = promisify(pipeline);

const INSTALL_DIR = "/tmp";
const INSTALL_EXTRACT_DIR = path.join(INSTALL_DIR, "apiPageBuilderImportPage");
const FILES_COUNT_IN_EACH_BATCH = 15;
const ZIP_CONTENT_TYPE = "application/zip";

interface UpdateFilesInPageDataParams {
    data: Record<string, any>;
    fileIdToKeyMap: Map<string, string>;
    srcPrefix: string;
}

function updateFilesInPageData({ data, fileIdToKeyMap, srcPrefix }: UpdateFilesInPageDataParams) {
    // BASE CASE: Termination point
    if (!data || typeof data !== "object") {
        return;
    }
    // Recursively call function if data is array
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            updateFilesInPageData({ data: element, fileIdToKeyMap, srcPrefix });
        }
        return;
    }
    // Main logic
    const tuple = Object.entries(data);
    for (let i = 0; i < tuple.length; i++) {
        const [key, value] = tuple[i];

        if (key === "file" && value && fileIdToKeyMap.has(value.id)) {
            value.key = fileIdToKeyMap.get(value.id);
            value.name = fileIdToKeyMap.get(value.id);
            value.src = `${srcPrefix}${srcPrefix.endsWith("/") ? "" : "/"}${fileIdToKeyMap.get(
                value.id
            )}`;
        } else {
            updateFilesInPageData({ data: value, srcPrefix, fileIdToKeyMap });
        }
    }
}

interface UploadPageAssetsParams {
    context: PbPageImportExportContext;
    filesData: Record<string, any>[];
    fileUploadsData: FileUploadsData;
}

interface UploadPageAssetsReturnType {
    fileIdToKeyMap?: Map<string, string>;
}

export const uploadPageAssets = async ({
    context,
    filesData,
    fileUploadsData
}: UploadPageAssetsParams): Promise<UploadPageAssetsReturnType> => {
    /**
     * This function contains logic of file download from S3.
     * Current we're not mocking zip file download from S3 in tests at the moment.
     * So, we're manually mocking it in case of test just by returning an empty object.
     */
    if (process.env.NODE_ENV === "test") {
        return {};
    }
    console.log("INSIDE uploadPageAssets");

    // Save uploaded file key against static id for later use.
    const fileIdToKeyMap = new Map<string, string>();
    // Save files meta data against old key for later use.
    const fileKeyToFileMap = new Map<string, Record<string, any>>();
    // Initialize maps.
    for (let i = 0; i < filesData.length; i++) {
        const file = filesData[i];
        fileKeyToFileMap.set(file.key, file);

        // Initialize the value
        fileIdToKeyMap.set(file.id, file.type);
    }

    const fileUploadResults = await uploadFilesFromS3({
        fileKeyToFileMap,
        oldKeyToNewKeyMap: fileUploadsData.assets
    });

    // Create files in File Manager
    const createFilesInput = fileUploadResults.map(uploadResult => {
        const newKey = uploadResult.Key;
        const file = fileKeyToFileMap.get(getOldFileKey(newKey));

        // Update the file map with newly uploaded file.
        fileIdToKeyMap.set(file.id, newKey);

        return {
            key: newKey,
            name: file.name,
            size: file.size,
            type: file.type,
            meta: file.meta,
            tags: file.tags
        } as FileInput;
    });

    const createFilesPromises = [];
    // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
    const createFilesInputChunks = chunk(createFilesInput, FILES_COUNT_IN_EACH_BATCH);
    for (let i = 0; i < createFilesInputChunks.length; i++) {
        const createFilesInputChunk = createFilesInputChunks[i];
        createFilesPromises.push(
            /*
             * We need to break down files into chunks because
             * `createFilesInBatch` operation has a limit on number of files it can handle at once.
             */
            context.fileManager.files.createFilesInBatch(createFilesInputChunk)
        );
    }

    await Promise.all(createFilesPromises);

    return {
        fileIdToKeyMap
    };
};

interface FileUploadsData {
    data: string;
    assets: Record<string, string>;
}

interface ImportPageParams {
    key: string;
    pageKey: string;
    context: PbPageImportExportContext;
    fileUploadsData: FileUploadsData;
}

export async function importPage({
    pageKey,
    context,
    fileUploadsData
}: ImportPageParams): Promise<Record<string, any>> {
    const log = console.log;

    // Making Directory for page in which we're going to extract the page data file.
    const PAGE_EXTRACT_DIR = path.join(INSTALL_EXTRACT_DIR, pageKey);
    ensureDirSync(PAGE_EXTRACT_DIR);

    const pageDataFileKey = dotProp.get(fileUploadsData, `data`);
    const PAGE_DATA_FILE_PATH = path.join(PAGE_EXTRACT_DIR, path.basename(pageDataFileKey));

    log(`Downloading Page data file: ${pageDataFileKey} at "${PAGE_DATA_FILE_PATH}"`);
    // Download and save page data file in disk.
    await new Promise((resolve, reject) => {
        s3Stream
            .readStream(pageDataFileKey)
            .on("error", reject)
            .pipe(createWriteStream(PAGE_DATA_FILE_PATH))
            .on("error", reject)
            .on("finish", resolve);
    });

    // Load the page data file from disk.
    log(`Load file ${pageDataFileKey}`);
    const { page, files } = await loadJson<Record<string, any>>(PAGE_DATA_FILE_PATH);

    // Only update page data if there are files.
    if (Array.isArray(files) && files.length) {
        // Upload page assets.
        const { fileIdToKeyMap } = await uploadPageAssets({
            context,
            filesData: files,
            fileUploadsData
        });

        const { srcPrefix } = await context.fileManager.settings.getSettings();
        updateFilesInPageData({ data: page.content, fileIdToKeyMap, srcPrefix });
    }

    log("Removing Directory for page...");
    await deleteFile(pageKey);

    log(`Remove page contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    return page;
}

interface UploadFilesFromZipParams {
    fileKeyToFileMap: Map<string, any>;
    oldKeyToNewKeyMap: Record<string, string>;
}

async function uploadFilesFromS3({
    fileKeyToFileMap,
    oldKeyToNewKeyMap
}: UploadFilesFromZipParams): Promise<S3.ManagedUpload.SendData[]> {
    const oldKeysForAssets = Object.keys(oldKeyToNewKeyMap);

    const promises = [];
    // Upload all assets.
    for (let i = 0; i < oldKeysForAssets.length; i++) {
        const oldKey = oldKeysForAssets[i];
        const tempNewKey = oldKeyToNewKeyMap[oldKey];

        // Read file.
        const readStream = s3Stream.readStream(tempNewKey);
        // Get file meta data.
        const fileMetaData = fileKeyToFileMap.get(oldKey);

        if (fileMetaData) {
            const newKey = uniqueId("", `-${fileMetaData.key}`);
            const { streamPassThrough, streamPassThroughUploadPromise: promise } =
                s3Stream.writeStream(newKey, fileMetaData.type);
            readStream.pipe(streamPassThrough);
            promises.push(promise);

            console.log(`Successfully queued file "${newKey}"`);
        }
    }

    return Promise.all(promises);
}

async function getObjectMetaFromS3(Key: string) {
    const meta = await s3Stream.getObjectHead(Key);

    if (meta.ContentType !== ZIP_CONTENT_TYPE) {
        throw new WebinyError(`Unsupported file type: "${meta.ContentType}"`, "UNSUPPORTED_FILE");
    }
}

function getOldFileKey(key: string) {
    /*
     * Because we know the naming convention, we can extract the old key from new key.
     */
    try {
        const [, ...rest] = key.split("-");
        return rest.join("-");
    } catch (e) {
        return key;
    }
}

const FILE_CONTENT_TYPE = "application/octet-stream";

function getFileNameWithoutExt(fileName: string): string {
    return path.basename(fileName).replace(path.extname(fileName), "");
}

interface PageImportData {
    assets: Record<string, string>;
    data: string;
    key: string;
}

/**
 * Function will read the given zip file from S3 via stream, extract its content and upload it to S3 bucket.
 * @param zipFileKey
 * @return PageImportData S3 file keys for all uploaded assets group by page.
 */
export async function readExtractAndUploadZipFileContents(
    zipFileKey: string
): Promise<PageImportData[]> {
    const log = console.log;
    const pageImportDataList = [];
    let readStream;
    // Check whether it is a URL
    if (zipFileKey.startsWith("http")) {
        const response = await fetch(zipFileKey);
        if (!response.ok) {
            throw new WebinyError(
                `Unable to downloading file: "${zipFileKey}"`,
                response.statusText
            );
        }

        readStream = response.body;
    } else {
        // We're first retrieving object's meta data, just to check whether the file is available at the given Key
        await getObjectMetaFromS3(zipFileKey);

        readStream = s3Stream.readStream(zipFileKey);
    }

    const uniquePath = uniqueId("IMPORT_PAGES/");
    const zipFileName = path.basename(zipFileKey);
    // Read export file and download it in the disk
    const ZIP_FILE_PATH = path.join(INSTALL_DIR, zipFileName);

    const writeStream = createWriteStream(ZIP_FILE_PATH);
    await streamPipeline(readStream, writeStream);
    log(`Downloaded file "${zipFileName}" at ${ZIP_FILE_PATH}`);

    // Extract the downloaded zip file
    const zipFilePaths = await extractZipToDisk(ZIP_FILE_PATH);

    log(`Removing ZIP file "${zipFileKey}" from ${ZIP_FILE_PATH}`);
    await deleteFile(ZIP_FILE_PATH);

    // Extract each page zip and upload their content's to S3
    for (let i = 0; i < zipFilePaths.length; i++) {
        const currentPath = zipFilePaths[i];
        const dataMap = await extractZipAndUploadToS3(currentPath, uniquePath);
        pageImportDataList.push(dataMap);
    }
    log("Removing all ZIP files located at ", path.dirname(zipFilePaths[0]));
    await deleteFile(path.dirname(zipFilePaths[0]));

    return pageImportDataList;
}

const ASSETS_DIR_NAME = "/assets";

function preparePageDataDirMap({
    map,
    filePath,
    newKey
}: {
    map: PageImportData;
    filePath: string;
    newKey: string;
}): PageImportData {
    const dirname = path.dirname(filePath);
    const fileName = path.basename(filePath);
    /*
     * We want to use dot (.) as part of object key rather than creating nested object(s).
     * Also, the file name might contain dots in it beside the extension, so, we are escaping them all.
     */
    const oldKey = fileName.replace(/\./g, "\\.");

    const isAsset = dirname.endsWith(ASSETS_DIR_NAME);

    if (isAsset) {
        map = dotProp.set(map, `assets.${oldKey}`, newKey);
    } else {
        // We only need to know the newKey for data file.
        map = dotProp.set(map, `data`, newKey);
    }

    return map;
}

async function deleteS3Folder(key) {
    // Append trailing slash i.e "/" to key to make sure we only delete a specific folder.
    if (!key.endsWith("/")) {
        key = `${key}/`;
    }

    const response = await s3Stream.listObject(key);
    const keys = response.Contents.map(c => c.Key);
    console.log(`Found ${keys.length} files.`);

    const deleteFilePromises = keys.map(key => s3Stream.deleteObject(key));

    await Promise.all(deleteFilePromises);
    console.log(`Successfully deleted ${deleteFilePromises.length} files.`);
}

export const zeroPad = version => `${version}`.padStart(5, "0");

export function initialStats(total) {
    return {
        [PageImportExportTaskStatus.PENDING]: total,
        [PageImportExportTaskStatus.PROCESSING]: 0,
        [PageImportExportTaskStatus.COMPLETED]: 0,
        [PageImportExportTaskStatus.FAILED]: 0,
        total
    };
}

function extractZipToDisk(exportFileZipPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const pageZipFilePaths = [];
        const uniqueFolderNameForExport = getFileNameWithoutExt(exportFileZipPath);
        const EXPORT_FILE_EXTRACTION_PATH = path.join(INSTALL_DIR, uniqueFolderNameForExport);
        // Make sure DIR exists
        ensureDirSync(EXPORT_FILE_EXTRACTION_PATH);

        yauzl.open(exportFileZipPath, { lazyEntries: true }, function (err, zipFile) {
            if (err) {
                console.warn("ERROR: Failed to extract zip: ", exportFileZipPath, err);
                reject(err);
            }

            console.info(`The ZIP file contains ${zipFile.entryCount} entries.`);

            zipFile.on("end", function (err) {
                if (err) {
                    console.warn("ERROR: Failed on END event for file: ", exportFileZipPath, err);
                    reject(err);
                }
                resolve(pageZipFilePaths);
            });

            zipFile.readEntry();

            zipFile.on("entry", function (entry) {
                console.info(`Processing entry: "${entry.fileName}"`);
                if (/\/$/.test(entry.fileName)) {
                    // Directory file names end with '/'.
                    // Note that entries for directories themselves are optional.
                    // An entry's fileName implicitly requires its parent directories to exist.
                    zipFile.readEntry();
                } else {
                    // file entry
                    zipFile.openReadStream(entry, function (err, readStream) {
                        if (err) {
                            console.warn(
                                "ERROR: Failed to openReadStream for file: ",
                                entry.fileName,
                                err
                            );
                            reject(err);
                        }

                        const filePath = path.join(EXPORT_FILE_EXTRACTION_PATH, entry.fileName);

                        readStream.on("end", function () {
                            pageZipFilePaths.push(filePath);
                            zipFile.readEntry();
                        });

                        streamPipeline(readStream, createWriteStream(filePath));
                    });
                }
            });
        });
    });
}

function extractZipAndUploadToS3(
    pageDataZipFilePath: string,
    uniquePath: string
): Promise<PageImportData> {
    return new Promise((resolve, reject) => {
        const filePaths = [];
        const fileUploadPromises = [];
        const uniquePageKey = getFileNameWithoutExt(pageDataZipFilePath);
        let dataMap: PageImportData = {
            key: uniquePageKey,
            assets: {},
            data: ""
        };
        yauzl.open(pageDataZipFilePath, { lazyEntries: true }, function (err, zipFile) {
            if (err) {
                console.warn("ERROR: Failed to extract zip: ", pageDataZipFilePath, err);
                reject(err);
            }
            console.info(`The ZIP file contains ${zipFile.entryCount} entries.`);
            zipFile.on("end", function (err) {
                if (err) {
                    console.warn('ERROR: Failed on "END" for file: ', pageDataZipFilePath, err);
                    reject(err);
                }

                Promise.all(fileUploadPromises).then(res => {
                    res.forEach(r => {
                        console.info("Done uploading... ", r);
                    });
                    resolve(dataMap);
                });
            });

            zipFile.readEntry();

            zipFile.on("entry", function (entry) {
                console.info(`Processing entry: "${entry.fileName}"`);
                if (/\/$/.test(entry.fileName)) {
                    // Directory file names end with '/'.
                    // Note that entries for directories themselves are optional.
                    // An entry's fileName implicitly requires its parent directories to exist.
                    zipFile.readEntry();
                } else {
                    // file entry
                    zipFile.openReadStream(entry, function (err, readStream) {
                        if (err) {
                            console.warn(
                                "ERROR: Failed while performing [openReadStream] for file: ",
                                entry.fileName,
                                err
                            );
                            reject(err);
                        }
                        readStream.on("end", function () {
                            filePaths.push(entry.fileName);
                            zipFile.readEntry();
                        });

                        const newKey = `${uniquePath}/${uniquePageKey}/${entry.fileName}`;
                        // Modify in place
                        dataMap = preparePageDataDirMap({
                            map: dataMap,
                            filePath: entry.fileName,
                            newKey
                        });

                        const { streamPassThrough, streamPassThroughUploadPromise: promise } =
                            s3Stream.writeStream(newKey, FILE_CONTENT_TYPE);

                        streamPipeline(readStream, streamPassThrough).then(() => {
                            fileUploadPromises.push(promise);
                        });
                    });
                }
            });
        });
    });
}
