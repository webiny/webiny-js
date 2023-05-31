import { mdbid } from "@webiny/utils";
import { PbImportExportContext } from "~/graphql/types";
import { File, FileInput } from "@webiny/api-file-manager/types";
import { UploadFileMap, uploadFilesFromS3 } from "~/import/utils/uploadFilesFromS3";
import { FileUploadsData } from "~/types";

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

    // Check if files with such keys were already imported.
    const fileKeys = files.map(file => file.key);
    const [existingImportedImages] = await context.fileManager.listFiles({
        where: { importedUnderKey_in: fileKeys }
    });

    // Link files that were already imported.
    for (const existingImportedImage of existingImportedImages) {
        const importFileId = files.find(
            file => file.key === existingImportedImage.importedUnderKey
        )?.id;
        if (importFileId) {
            oldIdToNewFileMap.set(importFileId, existingImportedImage);
        }
    }

    // Check if files with such keys already exist.
    const fileIds = files.map(file => file.id);
    const [existingImages] = await context.fileManager.listFiles({
        where: { id_in: fileIds }
    });
    const filteredFiles = files.filter(
        file =>
            !existingImages.some(existingImage => existingImage.key === file.key) &&
            !existingImportedImages.some(
                existingImportedImage => existingImportedImage.importedUnderKey === file.key
            )
    );

    // A map of temporary file keys (created during ZIP upload) to permanent file keys.
    const uploadFileMap: UploadFileMap = new Map();

    // Array of file inputs, to insert into the DB.
    const createFilesInput: FileInput[] = [];

    for (const oldFile of filteredFiles) {
        const id = mdbid();
        // We replace the old file ID with a new one.
        const newKey = `${id}/${oldFile.key.replace(`${oldFile.id}/`, "")}`;
        // We also add importedUnderKey property to prevent duplicates on future imports.
        const newFile: FileInput = { ...oldFile, id, key: newKey, importedUnderKey: oldFile.key };

        createFilesInput.push(newFile);
        oldIdToNewFileMap.set(oldFile.id, newFile);
        uploadFileMap.set(fileUploadsData.assets[oldFile.key], newFile);
    }

    await uploadFilesFromS3(uploadFileMap);

    await context.fileManager.createFilesInBatch(createFilesInput);

    return oldIdToNewFileMap;
};
