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
import { FileInput, File } from "@webiny/api-file-manager/types";
import WebinyError from "@webiny/error";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { File as ImageFile, ImportExportTaskStatus } from "~/types";
import { PbImportExportContext } from "~/graphql/types";
import { s3Stream } from "~/exportPages/s3Stream";
import { ExportedPageData, ExportedBlockData } from "~/exportPages/utils";
import { PageSettings } from "@webiny/api-page-builder/types";

interface FileItem extends File {
    key: string;
    type: string;
    name: string;
    size: number;
    meta: Record<string, any>;
    tags: string[];
}

const streamPipeline = promisify(pipeline);

const INSTALL_DIR = "/tmp";
const INSTALL_EXTRACT_DIR = path.join(INSTALL_DIR, "apiPageBuilderImport");
const FILES_COUNT_IN_EACH_BATCH = 15;

interface UpdateFilesInDataParams {
    data: Record<string, any>;
    fileIdToKeyMap: Map<string, string>;
    srcPrefix: string;
}

interface UpdateImageInPageSettingsParams {
    fileIdToKeyMap: Map<string, string>;
    srcPrefix: string;
    settings: PageSettings;
}

function updateImageInPageSettings(
    params: UpdateImageInPageSettingsParams
): UpdateImageInPageSettingsParams["settings"] {
    const { settings, fileIdToKeyMap, srcPrefix } = params;
    let newSettings = settings;

    const srcPrefixWithoutTrailingSlash = srcPrefix.endsWith("/")
        ? srcPrefix.slice(0, -1)
        : srcPrefix;

    if (dotProp.get(newSettings, "general.image.src")) {
        newSettings = dotProp.set(
            newSettings,
            "general.image.src",
            `${srcPrefixWithoutTrailingSlash}/${fileIdToKeyMap.get(
                settings.general?.image?.id || ""
            )}`
        );
    }
    if (dotProp.get(newSettings, "social.image.src")) {
        newSettings = dotProp.set(
            newSettings,
            "social.image.src",
            `${srcPrefixWithoutTrailingSlash}/${fileIdToKeyMap.get(
                settings.social?.image?.id || ""
            )}`
        );
    }

    return newSettings;
}

interface UpdateBlockPreviewImage {
    fileIdToKeyMap: Map<string, string>;
    srcPrefix: string;
    file: ImageFile;
}

function updateBlockPreviewImage(params: UpdateBlockPreviewImage): ImageFile {
    const { file, fileIdToKeyMap, srcPrefix } = params;
    const newFile = file;

    const srcPrefixWithoutTrailingSlash = srcPrefix.endsWith("/")
        ? srcPrefix.slice(0, -1)
        : srcPrefix;

    newFile.src = `${srcPrefixWithoutTrailingSlash}/${fileIdToKeyMap.get(file.id || "")}`;

    return newFile;
}

function updateFilesInData({ data, fileIdToKeyMap, srcPrefix }: UpdateFilesInDataParams) {
    // BASE CASE: Termination point
    if (!data || typeof data !== "object") {
        return;
    }
    // Recursively call function if data is array
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            updateFilesInData({ data: element, fileIdToKeyMap, srcPrefix });
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
            updateFilesInData({ data: value, srcPrefix, fileIdToKeyMap });
        }
    }
}

interface UploadAssetsParams {
    context: PbImportExportContext;
    filesData: File[];
    fileUploadsData: FileUploadsData;
}

interface UploadAssetsReturnType {
    fileIdToKeyMap: Map<string, string>;
}

export const uploadAssets = async (params: UploadAssetsParams): Promise<UploadAssetsReturnType> => {
    const { context, filesData, fileUploadsData } = params;
    // Save uploaded file key against static id for later use.
    const fileIdToKeyMap = new Map<string, string>();
    /**
     * This function contains logic of file download from S3.
     * Current we're not mocking zip file download from S3 in tests at the moment.
     * So, we're manually mocking it in case of test just by returning an empty object.
     */
    if (process.env.NODE_ENV === "test") {
        return {
            fileIdToKeyMap
        };
    }

    // Save files meta data against old key for later use.
    const fileKeyToFileMap = new Map<string, FileItem>();
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
    const createFilesInput = fileUploadResults
        .map((uploadResult): FileInput | null => {
            const newKey = uploadResult.Key;
            const file = fileKeyToFileMap.get(getOldFileKey(newKey));
            if (!file) {
                return null;
            }

            // Update the file map with newly uploaded file.
            fileIdToKeyMap.set(file.id, newKey);

            return {
                key: newKey,
                name: file.name,
                size: file.size,
                type: file.type,
                meta: file.meta,
                tags: file.tags
            };
        })
        .filter(Boolean) as FileInput[];

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
    context: PbImportExportContext;
    fileUploadsData: FileUploadsData;
}

export async function importPage({
    pageKey,
    context,
    fileUploadsData
}: ImportPageParams): Promise<ExportedPageData["page"]> {
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
    const { page, files } = await loadJson<ExportedPageData>(PAGE_DATA_FILE_PATH);

    // Only update page data if there are files.
    if (files && Array.isArray(files) && files.length > 0) {
        // Upload page assets.
        const { fileIdToKeyMap } = await uploadAssets({
            context,
            /**
             * TODO @ts-refactor @ashutosh figure out correct types.
             */
            // @ts-ignore
            filesData: files,
            fileUploadsData
        });

        const settings = await context.fileManager.settings.getSettings();

        const { srcPrefix = "" } = settings || {};
        updateFilesInData({
            data: page.content || {},
            fileIdToKeyMap,
            srcPrefix
        });

        page.settings = updateImageInPageSettings({
            settings: page.settings || {},
            fileIdToKeyMap,
            srcPrefix
        });
    }

    log("Removing Directory for page...");
    await deleteFile(pageKey);

    log(`Remove page contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    return page;
}

interface ImportBlockParams {
    key: string;
    blockKey: string;
    context: PbImportExportContext;
    fileUploadsData: FileUploadsData;
}

export async function importBlock({
    blockKey,
    context,
    fileUploadsData
}: ImportBlockParams): Promise<ExportedBlockData["block"]> {
    const log = console.log;

    // Making Directory for block in which we're going to extract the block data file.
    const BLOCK_EXTRACT_DIR = path.join(INSTALL_EXTRACT_DIR, blockKey);
    ensureDirSync(BLOCK_EXTRACT_DIR);

    const blockDataFileKey = dotProp.get(fileUploadsData, `data`);
    const BLOCK_DATA_FILE_PATH = path.join(BLOCK_EXTRACT_DIR, path.basename(blockDataFileKey));

    log(`Downloading Block data file: ${blockDataFileKey} at "${BLOCK_DATA_FILE_PATH}"`);
    // Download and save block data file in disk.
    await new Promise((resolve, reject) => {
        s3Stream
            .readStream(blockDataFileKey)
            .on("error", reject)
            .pipe(createWriteStream(BLOCK_DATA_FILE_PATH))
            .on("error", reject)
            .on("finish", resolve);
    });

    // Load the block data file from disk.
    log(`Load file ${blockDataFileKey}`);
    const { block, files } = await loadJson<ExportedBlockData>(BLOCK_DATA_FILE_PATH);

    // Only update block data if there are files.
    if (files && Array.isArray(files) && files.length > 0) {
        // Upload block assets.
        const { fileIdToKeyMap } = await uploadAssets({
            context,
            filesData: files,
            fileUploadsData
        });

        const settings = await context.fileManager.settings.getSettings();

        const { srcPrefix = "" } = settings || {};
        updateFilesInData({
            data: block.content || {},
            fileIdToKeyMap,
            srcPrefix
        });

        block.preview = updateBlockPreviewImage({
            file: block.preview || {},
            fileIdToKeyMap,
            srcPrefix
        });
    }

    log("Removing Directory for block...");
    await deleteFile(blockKey);

    log(`Remove block contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    return block;
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

interface ImportData {
    assets: Record<string, string>;
    data: string;
    key: string;
}

/**
 * Function will read the given zip file from S3 via stream, extract its content and upload it to S3 bucket.
 * @param zipFileUrl
 * @return ImportData S3 file keys for all uploaded assets group by page/block.
 */
export async function readExtractAndUploadZipFileContents(
    zipFileUrl: string
): Promise<ImportData[]> {
    const log = console.log;
    const importDataList = [];

    const zipFileName = path.basename(zipFileUrl).split("?")[0];

    const response = await fetch(zipFileUrl);
    if (!response.ok) {
        throw new WebinyError(`Unable to downloading file: "${zipFileUrl}"`, response.statusText);
    }

    const readStream = response.body;

    const uniquePath = uniqueId("IMPORTS/");
    // Read export file and download it in the disk
    const ZIP_FILE_PATH = path.join(INSTALL_DIR, zipFileName);

    const writeStream = createWriteStream(ZIP_FILE_PATH);
    await streamPipeline(readStream, writeStream);
    log(`Downloaded file "${zipFileName}" at ${ZIP_FILE_PATH}`);

    // Extract the downloaded zip file
    const zipFilePaths = await extractZipToDisk(ZIP_FILE_PATH);

    log(`Removing ZIP file "${zipFileUrl}" from ${ZIP_FILE_PATH}`);
    await deleteFile(ZIP_FILE_PATH);

    // Extract each page/block zip and upload their content's to S3
    for (let i = 0; i < zipFilePaths.length; i++) {
        const currentPath = zipFilePaths[i];
        const dataMap = await extractZipAndUploadToS3(currentPath, uniquePath);
        importDataList.push(dataMap);
    }
    log("Removing all ZIP files located at ", path.dirname(zipFilePaths[0]));
    await deleteFile(path.dirname(zipFilePaths[0]));

    return importDataList;
}

const ASSETS_DIR_NAME = "/assets";

function prepareDataDirMap({
    map,
    filePath,
    newKey
}: {
    map: ImportData;
    filePath: string;
    newKey: string;
}): ImportData {
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

async function deleteS3Folder(key: string): Promise<void> {
    // Append trailing slash i.e "/" to key to make sure we only delete a specific folder.
    if (!key.endsWith("/")) {
        key = `${key}/`;
    }

    const response = await s3Stream.listObject(key);
    const keys = (response.Contents || []).map(c => c.Key).filter(Boolean) as string[];
    console.log(`Found ${keys.length} files.`);

    const deleteFilePromises = keys.map(key => s3Stream.deleteObject(key));

    await Promise.all(deleteFilePromises);
    console.log(`Successfully deleted ${deleteFilePromises.length} files.`);
}

// export const zeroPad = version => `${version}`.padStart(5, "0");

export function initialStats(total: number) {
    return {
        [ImportExportTaskStatus.PENDING]: total,
        [ImportExportTaskStatus.PROCESSING]: 0,
        [ImportExportTaskStatus.COMPLETED]: 0,
        [ImportExportTaskStatus.FAILED]: 0,
        total
    };
}

function extractZipToDisk(exportFileZipPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const zipFilePaths: string[] = [];
        const uniqueFolderNameForExport = getFileNameWithoutExt(exportFileZipPath);
        const EXPORT_FILE_EXTRACTION_PATH = path.join(INSTALL_DIR, uniqueFolderNameForExport);
        // Make sure DIR exists
        ensureDirSync(EXPORT_FILE_EXTRACTION_PATH);

        yauzl.open(exportFileZipPath, { lazyEntries: true }, function (err, zipFile) {
            if (err) {
                console.warn("ERROR: Failed to extract zip: ", exportFileZipPath, err);
                reject(err);
                return;
            }
            if (!zipFile) {
                console.log("ERROR: Missing zip file resource for path: " + exportFileZipPath);
                reject("Missing Zip File Resource.");
                return;
            }

            console.info(`The ZIP file contains ${zipFile.entryCount} entries.`);

            zipFile.on("end", function (err) {
                if (err) {
                    console.warn("ERROR: Failed on END event for file: ", exportFileZipPath, err);
                    reject(err);
                }
                resolve(zipFilePaths);
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
                            return;
                        }
                        if (!readStream) {
                            console.log(
                                "ERROR: Missing Read Stream Resource when extracting to disk."
                            );
                            reject("Missing Read Stream Resource.");
                            return;
                        }

                        const filePath = path.join(EXPORT_FILE_EXTRACTION_PATH, entry.fileName);

                        readStream.on("end", function () {
                            zipFilePaths.push(filePath);
                            zipFile.readEntry();
                        });

                        streamPipeline(readStream, createWriteStream(filePath)).catch(error => {
                            reject(error);
                        });
                    });
                }
            });
        });
    });
}

function extractZipAndUploadToS3(dataZipFilePath: string, uniquePath: string): Promise<ImportData> {
    return new Promise((resolve, reject) => {
        const filePaths = [];
        const fileUploadPromises: Promise<S3.ManagedUpload.SendData>[] = [];
        const uniqueKey = getFileNameWithoutExt(dataZipFilePath);
        let dataMap: ImportData = {
            key: uniqueKey,
            assets: {},
            data: ""
        };
        yauzl.open(dataZipFilePath, { lazyEntries: true }, function (err, zipFile) {
            if (err) {
                console.warn("ERROR: Failed to extract zip: ", dataZipFilePath, err);
                reject(err);
                return;
            }
            if (!zipFile) {
                console.log("ERROR: Probably failed to extract zip: " + dataZipFilePath);
                reject("Missing Zip File Resource.");
                return;
            }
            console.info(`The ZIP file contains ${zipFile.entryCount} entries.`);
            zipFile.on("end", function (err) {
                if (err) {
                    console.warn('ERROR: Failed on "END" for file: ', dataZipFilePath, err);
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
                            return;
                        }
                        if (!readStream) {
                            console.log("ERROR: Missing Read Stream while importing.");
                            reject("Missing Read Strea Resource.");
                            return;
                        }
                        readStream.on("end", function () {
                            filePaths.push(entry.fileName);
                            zipFile.readEntry();
                        });

                        const newKey = `${uniquePath}/${uniqueKey}/${entry.fileName}`;
                        // Modify in place
                        dataMap = prepareDataDirMap({
                            map: dataMap,
                            filePath: entry.fileName,
                            newKey
                        });

                        const { streamPassThrough, streamPassThroughUploadPromise: promise } =
                            s3Stream.writeStream(newKey, FILE_CONTENT_TYPE);

                        streamPipeline(readStream, streamPassThrough)
                            .then(() => {
                                fileUploadPromises.push(promise);
                            })
                            .catch(error => {
                                reject(error);
                            });
                    });
                }
            });
        });
    });
}
