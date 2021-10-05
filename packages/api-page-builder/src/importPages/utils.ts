import unzipper from "unzipper";
import uniqueId from "uniqid";
import S3 from "aws-sdk/clients/s3";
import dotProp from "dot-prop-immutable";
import fs from "fs-extra";
import fetch from "node-fetch";
import { deleteFile } from "~/graphql/crud/install/utils/downloadInstallFiles";
import path from "path";
import chunk from "lodash/chunk";
import loadJson from "load-json-file";
import { PbContext } from "~/graphql/types";
import { FileInput } from "@webiny/api-file-manager/types";
import WebinyError from "@webiny/error";
import { PageImportExportTaskStatus, Page } from "~/types";
import { s3Stream } from "~/exportPages/s3Stream";

export type CreatePage = () => Promise<Page>;
export type UpdatePage = (page: Page, content: Record<string, any>) => Promise<Page>;

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
    context: PbContext;
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
    context: PbContext;
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
    fs.ensureDirSync(PAGE_EXTRACT_DIR);

    const pageDataFileKey = dotProp.get(fileUploadsData, `data`);
    const PAGE_DATA_FILE_PATH = path.join(PAGE_EXTRACT_DIR, path.basename(pageDataFileKey));

    log(`Downloading Page data file: ${pageDataFileKey} at "${PAGE_DATA_FILE_PATH}"`);
    // Download and save page data file in disk.
    await new Promise((resolve, reject) => {
        s3Stream
            .readStream(pageDataFileKey)
            .on("error", reject)
            .pipe(fs.createWriteStream(PAGE_DATA_FILE_PATH))
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
const ZIP_EXTENSION = ".zip";

/**
 * Function will read the given zip file from S3 via stream, extract its content and upload it to S3 bucket.
 * @param zipFileKey
 * @return dataMap S3 file keys for all uploaded assets group by page.
 */
export async function readExtractAndUploadZipFileContents(
    zipFileKey: string
): Promise<Record<string, any>> {
    const log = console.log;
    let dataMap = {};
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
    /**
     * Note:
     * The page export file (zip) itself contains one or more zip files that contains the export data for individual pages.
     * So, we need to perform unzip operation twice, once for top level zip and then for inner zip containing page data.
     */
    const uniquePath = uniqueId("IMPORT_PAGES/");
    // Extract top level zip file.
    const zip = readStream.pipe(unzipper.Parse({ forceStream: true }));
    const pageDataZipUploadPromises = [];
    // Process each entry in the zip file.
    for await (const entry of zip) {
        const filePath = entry.path;
        log(`Processing zip file "${filePath}" from top level zip.`);
        const type = entry.type; // 'Directory' or 'File'

        if (type === "File" && filePath.endsWith(ZIP_EXTENSION)) {
            const newKey = `${uniquePath}/${filePath}`;

            const { streamPassThrough, streamPassThroughUploadPromise: promise } =
                s3Stream.writeStream(newKey, ZIP_CONTENT_TYPE);
            entry.pipe(streamPassThrough);
            /**
             * Note: We're not simply awaiting the promise inside async-iterator because
             * the streams returned by "unzipper.Parse()" doesn't work reliably that way.
             *
             * https://github.com/ZJONSSON/node-unzipper/issues/193#issuecomment-654990068
             */
            pageDataZipUploadPromises.push(promise);
            console.log(`Successfully queued file "${filePath}" for upload.`);
        } else {
            entry.autodrain();
        }
    }

    const zipKeys = await Promise.all(pageDataZipUploadPromises).then(results =>
        results.map(({ Key }) => Key)
    );

    const pagesDataUploadPromises = [];
    // Process each zip file.
    for (let i = 0; i < zipKeys.length; i++) {
        const zipKey = zipKeys[i];
        const uniquePageKey = path.basename(zipKey).replace(path.extname(zipKey), "");

        const zip = s3Stream.readStream(zipKey).pipe(unzipper.Parse({ forceStream: true }));
        // Process each entry in the zip file.
        for await (const entry of zip) {
            const filePath = entry.path;

            console.log(`Processing page file ${filePath}`);
            const type = entry.type; // 'Directory' or 'File'

            if (type === "File") {
                const newKey = `${uniquePath}/${uniquePageKey}/${filePath}`;

                dataMap = prepareMap({ map: dataMap, filePath, newKey });

                const { streamPassThrough, streamPassThroughUploadPromise: promise } =
                    s3Stream.writeStream(newKey, FILE_CONTENT_TYPE);
                entry.pipe(streamPassThrough);
                /**
                 * Note: We're not simply awaiting the promise inside async-iterator because
                 * the streams returned by "unzipper.Parse()" doesn't work reliably that way.
                 *
                 * https://github.com/ZJONSSON/node-unzipper/issues/193#issuecomment-654990068
                 */
                pagesDataUploadPromises.push(promise);
                console.log(`Successfully queued  page file "${filePath}" for upload.`);
            } else {
                entry.autodrain();
            }
        }
    }

    await Promise.all(pageDataZipUploadPromises);

    return dataMap;
}

const ASSETS_DIR_NAME = "/assets";

function prepareMap({ map, filePath, newKey }) {
    const dirname = path.dirname(filePath);
    const fileName = path.basename(filePath);
    /*
     * We want to use dot (.) as part of object key rather than creating nested object(s).
     * Also, the file name might contain dots in it beside the extension, so, we are escaping them all.
     */
    const oldKey = fileName.replace(/\./g, "\\.");

    const isAsset = dirname.endsWith(ASSETS_DIR_NAME);

    if (isAsset) {
        const folder = dirname.replace(ASSETS_DIR_NAME, "");
        map = dotProp.set(map, `${folder}.assets.${oldKey}`, newKey);
    } else {
        // We only need to know the newKey for data file.
        map = dotProp.set(map, `${dirname}.data`, newKey);
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

interface UpdateMainTaskStatsParams {
    pageBuilder: PbContext["pageBuilder"];
    taskId: string;
    currentStatus: PageImportExportTaskStatus;
    previousStatus: PageImportExportTaskStatus;
}

export async function updateMainTask({
    pageBuilder,
    taskId,
    currentStatus,
    previousStatus
}: UpdateMainTaskStatsParams) {
    // TODO: @ashutosh use Dynamodb Toolbox
    /**
     *  Current implementation make two DB calls to update task `stats` due to DB client limitations.
     *  After migrating to storage operations, we'll use the update method of Dynamodb Toolbox entity to avoid
     *  redundant DB call.
     */
    const task = await pageBuilder.pageImportExportTask.get(taskId);

    await pageBuilder.pageImportExportTask.update(taskId, {
        status: PageImportExportTaskStatus.PROCESSING,
        stats: {
            ...task.stats,
            // Increment current status count.
            [currentStatus]: task.stats[currentStatus] + 1,
            // Decrement previous status count.
            [previousStatus]: task.stats[previousStatus] - 1
        }
    });
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
