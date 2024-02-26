import path from "path";
import dotProp from "dot-prop-immutable";
import loadJson from "load-json-file";
import { createWriteStream, ensureDirSync } from "fs-extra";
import { PbImportExportContext } from "~/graphql/types";
import { FileUploadsData } from "~/types";
import { INSTALL_EXTRACT_DIR } from "~/import/constants";
import { s3Stream } from "~/export/s3Stream";
import { uploadAssets } from "~/import/utils/uploadAssets";
import { updateFilesInData } from "~/import/utils/updateFilesInData";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { deleteS3Folder } from "~/import/utils/deleteS3Folder";
import { ExportedTemplateData } from "~/export/process/exporters/PageTemplateExporter";

interface ImportTemplateParams {
    key: string;
    templateKey: string;
    context: PbImportExportContext;
    fileUploadsData: FileUploadsData;
}

export async function importTemplate({
    templateKey,
    context,
    fileUploadsData
}: ImportTemplateParams): Promise<ExportedTemplateData["template"]> {
    const log = console.log;

    // Making Directory for template in which we're going to extract the template data file.
    const TEMPLATE_EXTRACT_DIR = path.join(INSTALL_EXTRACT_DIR, templateKey);
    ensureDirSync(TEMPLATE_EXTRACT_DIR);

    const templateDataFileKey = dotProp.get(fileUploadsData, `data`);
    const TEMPLATE_DATA_FILE_PATH = path.join(
        TEMPLATE_EXTRACT_DIR,
        path.basename(templateDataFileKey)
    );

    log(`Downloading Template data file: ${templateDataFileKey} at "${TEMPLATE_DATA_FILE_PATH}"`);
    // Download and save template data file in disk.
    const readStream = await s3Stream.readStream(templateDataFileKey);
    const writeStream = createWriteStream(TEMPLATE_DATA_FILE_PATH);

    await new Promise((resolve, reject) => {
        readStream.on("error", reject).pipe(writeStream).on("finish", resolve).on("error", reject);
    });

    // Load the template data file from disk.
    log(`Load file ${templateDataFileKey}`);
    const { template, files } = await loadJson<ExportedTemplateData>(TEMPLATE_DATA_FILE_PATH);

    // Only update template data if there are files.
    if (files && Array.isArray(files) && files.length > 0) {
        // Upload template assets.
        const fileIdToNewFileMap = await uploadAssets({
            context,
            files,
            fileUploadsData
        });

        const settings = await context.fileManager.getSettings();

        const { srcPrefix = "" } = settings || {};
        updateFilesInData({
            data: template.content || {},
            fileIdToNewFileMap,
            srcPrefix
        });
    }

    log("Removing Directory for template...");
    await deleteFile(templateKey);

    log(`Remove template contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    return template;
}
