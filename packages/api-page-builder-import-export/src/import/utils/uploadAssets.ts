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

function notAPreviouslyImportedFile(importedImages: File[]) {
    return (file: File) => {
        return !importedImages.some(
            existingImportedImage => existingImportedImage.meta.originalKey === file.key
        );
    };
}

function notAnExistingFile(existingFiles: File[]) {
    return (file: File) => {
        return !existingFiles.some(existingFile => existingFile.key === file.key);
    };
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

    // Check if the requested files were already imported in the past.
    const [importedImages] = await context.fileManager.listFiles({
        where: { meta: { originalKey_in: files.map(file => file.key) } }
    });

    // Link files that were already imported.
    for (const importedImage of importedImages) {
        const fileBeingImported = files.find(file => file.key === importedImage.meta.originalKey);

        if (fileBeingImported) {
            oldIdToNewFileMap.set(fileBeingImported.id, importedImage);
        }
    }

    // Check if files with such IDs already exist.
    const [existingFiles] = await context.fileManager.listFiles({
        where: { id_in: files.map(file => file.id) }
    });

    const newFilesToImport = files
        .filter(notAnExistingFile(existingFiles))
        .filter(notAPreviouslyImportedFile(importedImages));

    // A map of temporary file keys (created during ZIP upload) to permanent file keys.
    const uploadFileMap: UploadFileMap = new Map();

    // Array of file inputs, to insert into the DB.
    const createFilesInput: FileInput[] = [];

    for (const toImport of newFilesToImport) {
        // We generate a new file id, key, and add `meta.originalKey` property to prevent duplicates on future imports.
        const id = mdbid();
        const newKey = `${id}/${toImport.key.replace(`${toImport.id}/`, "")}`;
        const newFile: FileInput = {
            ...toImport,
            id,
            location: {
                folderId: "root"
            },
            key: newKey,
            meta: { ...toImport.meta, originalKey: toImport.key }
        };

        createFilesInput.push(newFile);
        oldIdToNewFileMap.set(toImport.id, newFile);
        uploadFileMap.set(fileUploadsData.assets[toImport.key], newFile);
    }

    await uploadFilesFromS3(uploadFileMap);

    await context.fileManager.createFilesInBatch(createFilesInput);

    return oldIdToNewFileMap;
};
