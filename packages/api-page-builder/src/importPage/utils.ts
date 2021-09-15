import unzipper from "unzipper";
import uniqueId from "uniqid";
import S3 from "aws-sdk/clients/s3";
import dotProp from "dot-prop-immutable";
import fs from "fs-extra";
import { PassThrough } from "stream";
import { deleteFile } from "~/graphql/crud/install/utils/downloadInstallFiles";
import path from "path";
import chunk from "lodash/chunk";
import loadJson from "load-json-file";
import { updateFilesInPageData } from "~/graphql/crud/pages/importPage";
import { PbContext } from "~/graphql/types";
import { FileInput } from "@webiny/api-file-manager/types";
import { Page } from "~/types";

export type CreatePage = () => Promise<Page>;
export type UpdatePage = (page: Page, content: Record<string, any>) => Promise<Page>;

const INSTALL_DIR = "/tmp";
const INSTALL_EXTRACT_DIR = path.join(INSTALL_DIR, "apiPageBuilderImportPage");
const FILES_COUNT_IN_EACH_BATCH = 15;

const s3 = new S3({ region: process.env.AWS_REGION });

export async function openZipFile(Key: string) {
    // TODO: Replace the Open.s3 with a custom implementation of Open.file
    return await unzipper.Open.s3(s3, { Bucket: process.env.S3_BUCKET, Key });
}

const SYSTEM_DIR_NAMES = ["__MACOSX"];
const ignoreSystemFile = file =>
    SYSTEM_DIR_NAMES.every(systemDirName => !file.path.startsWith(systemDirName));

//  TODO: we might not need it if we could get this structure while doing the export.
export function prepareStructure(directory) {
    let map = {};
    directory.files.filter(ignoreSystemFile).forEach(file => {
        const [folder, ...rest] = file.path.split("/");
        const filePath = rest.join("/");

        const isAsset = filePath.startsWith("assets/");

        if (isAsset) {
            map = dotProp.set(map, `${folder}.assets`, assets =>
                Array.isArray(assets) ? [...assets, file] : [file]
            );
        } else {
            map = dotProp.set(map, `${folder}.data`, file);
        }
    });
    return map;
}

interface UploadPageAssetsParams {
    context: PbContext;
    filesData: Record<string, any>[];
    zipFileKey: string;
    pageKey: string;
}

interface UploadPageAssetsReturnType {
    fileIdToKeyMap?: Record<string, string>;
}

// FIXME: We currently only support import page via ZIP file key
export const uploadPageAssets = async ({
    context,
    filesData,
    zipFileKey,
    pageKey
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

    // TODO: Should we use Map() for this?
    // Save uploaded file key against static id for later use.
    const fileIdToKeyMap = {};

    // Initialize fileKeyToFileMap
    const fileKeyToFileMap = {};
    for (let i = 0; i < filesData.length; i++) {
        const file = filesData[i];
        fileKeyToFileMap[file.key] = file;

        // Initialize the value
        fileIdToKeyMap[file.id] = file.type;
    }

    const fileUploadResults = await uploadFilesFromZip({
        fileKeyToFileMap,
        zipFileKey,
        pageKey
    });

    // TODO: Remove after testing
    console.log(JSON.stringify({ fileUploadResults }));
    // Create files in File Manager
    const createFilesInput = fileUploadResults.map(uploadResult => {
        const key = uploadResult.Key;

        const file = fileKeyToFileMap[getOldFileKey(key)];

        return {
            key: key,
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

    const fileCreateResults = await Promise.all(createFilesPromises);
    // TODO: Remove after testing
    console.log(JSON.stringify({ fileCreateResults }));

    // Save File key against static ID
    fileCreateResults.flat().forEach(item => {
        const file = fileKeyToFileMap[getOldFileKey(item.key)];
        // Update the file map with newly uploaded file.
        fileIdToKeyMap[file.id] = item.key;
    });

    return {
        fileIdToKeyMap
    };
};

function uploadStream(Key: string, contentType: string) {
    const passThrough = new PassThrough();
    return {
        passThrough,
        promise: s3
            .upload({
                Bucket: process.env.S3_BUCKET,
                Key,
                Body: passThrough,
                ContentType: contentType
            })
            .promise()
    };
}

interface ImportPageParams {
    key: string;
    pageKey: string;
    createPage: CreatePage;
    updatePage: UpdatePage;
    context: PbContext;
}

export async function importPage({
    key,
    pageKey,
    createPage,
    updatePage,
    context
}: ImportPageParams) {
    const log = console.log;
    // TODO: Replace the Open.s3 with a custom implementation of Open.file
    // TODO: Replace it with ParseOne(page)
    const directory = await unzipper.Open.s3(s3, { Bucket: process.env.S3_BUCKET, Key: key });
    const pagesDirMap = prepareStructure(directory);

    log(`Page "${pageKey}"`);

    log("Making Directory for page...");
    const PAGE_EXTRACT_DIR = path.join(INSTALL_EXTRACT_DIR, pageKey);
    fs.ensureDirSync(PAGE_EXTRACT_DIR);
    // Download page data file
    const pageDataFile = dotProp.get(pagesDirMap, `${pageKey}.data`);
    log(`Downloading Page data file: ${pageDataFile.path}`);
    const PAGE_DATA_FILE_PATH = path.join(INSTALL_EXTRACT_DIR, pageDataFile.path);
    await new Promise((resolve, reject) => {
        pageDataFile
            .stream()
            .pipe(fs.createWriteStream(PAGE_DATA_FILE_PATH))
            .on("error", reject)
            .on("finish", resolve);
    });

    // Load the data file
    const pageDataFilePath = pageDataFile.path;
    log("File loaded => ", pageDataFilePath);
    const { page, files } = await loadJson<Record<string, any>>(PAGE_DATA_FILE_PATH);

    // Only update page data if there are files
    if (Array.isArray(files) && files.length) {
        // Upload page assets
        const { fileIdToKeyMap } = await uploadPageAssets({
            context,
            filesData: files,
            zipFileKey: key,
            pageKey
        });

        const { srcPrefix } = await context.fileManager.settings.getSettings();
        updateFilesInPageData({ data: page.content, fileIdToKeyMap, srcPrefix });
    }

    // Create a page
    const pbPage = await createPage();

    // Update page with data
    await updatePage(pbPage, page.content);

    // delete the file
    console.log("Removing Directory for page...");
    await deleteFile(pageKey);
}

interface UploadFilesFromZipParams {
    fileKeyToFileMap: Record<string, any>;
    zipFileKey: string;
    pageKey: string;
}

async function uploadFilesFromZip({
    fileKeyToFileMap,
    zipFileKey,
    pageKey
}: UploadFilesFromZipParams): Promise<S3.ManagedUpload.SendData[]> {
    // Read file
    const readStream = getS3FileStream(zipFileKey);

    const zip = readStream.pipe(unzipper.Parse({ forceStream: true }));
    const promises = [];
    for await (const entry of zip) {
        const filePath = entry.path;

        const tokens = filePath.split("/");
        const fileName = tokens[tokens.length - 1];
        const type = entry.type; // 'Directory' or 'File'
        const fileMetaData = fileKeyToFileMap[fileName];

        if (
            type === "File" &&
            !isSystemFile(filePath) &&
            pathIsEqual(filePath, pageKey) &&
            fileMetaData
        ) {
            console.log(`Preparing file "${filePath}" for upload`);

            const { passThrough, promise } = uploadStream(
                uniqueId("", `-${fileMetaData.key}`),
                fileMetaData.type
            );
            entry.pipe(passThrough);

            promises.push(promise);
            console.log(`Successfully queued file "${filePath}"`);
        } else {
            entry.autodrain();
        }
    }

    return Promise.all(promises);
}

function pathIsEqual(fullPath: string, pageKey: string) {
    const [parent] = fullPath.split("/");
    return parent === pageKey;
}

// TODO: Move into FileStorage plugins
function getS3FileStream(Key) {
    return s3
        .getObject({
            Bucket: process.env.S3_BUCKET,
            Key: Key
        })
        .createReadStream();
}

const IGNORE_SYSTEM_FILES = ["__MACOSX"];
const isSystemFile = fileName => {
    return IGNORE_SYSTEM_FILES.some(system => fileName.startsWith(system));
};

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
