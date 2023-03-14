// @ts-ignore
import mdbid from "mdbid";
import chunk from "lodash/chunk";
import { PbImportExportContext } from "~/graphql/types";
import { File, FileInput } from "@webiny/api-file-manager/types";
import { UploadFileMap, uploadFilesFromS3 } from "~/import/utils/uploadFilesFromS3";
import { FileUploadsData } from "~/types";

const FILES_COUNT_IN_EACH_BATCH = 15;

interface UploadAssetsParams {
    context: PbImportExportContext;
    files: File[];
    fileUploadsData: FileUploadsData;
}

export const uploadAssets = async (params: UploadAssetsParams) => {
    const { context, files, fileUploadsData } = params;

    const oldIdToNewFileMap = new Map<string, FileInput>();

    /**
     * This function contains logic of file download from S3.
     * Current we're not mocking zip file download from S3 in tests at the moment.
     * So, we're manually mocking it in case of test just by returning an empty object.
     */
    if (process.env.NODE_ENV === "test") {
        return oldIdToNewFileMap;
    }

    // Check if files with such keys already exist
    const [existingFiles] = await context.fileManager.files.listFiles();
    const filteredFiles = files.filter(
        file => !existingFiles.some(existingFile => existingFile.key === file.key)
    );

    // A map of temporary file keys (created during ZIP upload) to permanent file keys.
    const uploadFileMap: UploadFileMap = new Map();

    // Array of file inputs, to insert into the DB.
    const createFilesInput: FileInput[] = [];

    for (const oldFile of filteredFiles) {
        const id = mdbid();
        // We replace the old file ID with a new one.
        const newKey = `${id}/${oldFile.key.replace(`${oldFile.id}/`, "")}`;
        const newFile: FileInput = { ...oldFile, id, key: newKey };

        createFilesInput.push(newFile);
        oldIdToNewFileMap.set(oldFile.id, newFile);
        uploadFileMap.set(fileUploadsData.assets[oldFile.key], newFile);
    }

    await uploadFilesFromS3(uploadFileMap);

    // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
    const createFilesInputChunks = chunk(createFilesInput, FILES_COUNT_IN_EACH_BATCH);
    for (const inputChunk of createFilesInputChunks) {
        await context.fileManager.files.createFilesInBatch(inputChunk);
    }

    return oldIdToNewFileMap;
};
