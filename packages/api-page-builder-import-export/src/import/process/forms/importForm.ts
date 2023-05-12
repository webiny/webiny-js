import dotProp from "dot-prop-immutable";
import { createWriteStream, ensureDirSync } from "fs-extra";
import path from "path";
import loadJson from "load-json-file";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { FileUploadsData } from "~/types";
import { s3Stream } from "~/export/s3Stream";
import { ExportedFormData } from "~/export/utils";
import { deleteS3Folder } from "~/import/utils/deleteS3Folder";
import { INSTALL_EXTRACT_DIR } from "~/import/constants";

interface ImportFormParams {
    key: string;
    formKey: string;
    fileUploadsData: FileUploadsData;
}

export async function importForm({
    formKey,
    fileUploadsData
}: ImportFormParams): Promise<ExportedFormData["form"]> {
    const log = console.log;

    // Making Directory for form in which we're going to extract the form data file.
    const FORM_EXTRACT_DIR = path.join(INSTALL_EXTRACT_DIR, formKey);
    ensureDirSync(FORM_EXTRACT_DIR);

    const formDataFileKey = dotProp.get(fileUploadsData, `data`);
    const FORM_DATA_FILE_PATH = path.join(FORM_EXTRACT_DIR, path.basename(formDataFileKey));

    log(`Downloading Form data file: ${formDataFileKey} at "${FORM_DATA_FILE_PATH}"`);
    // Download and save form data file in disk.
    await new Promise((resolve, reject) => {
        s3Stream
            .readStream(formDataFileKey)
            .on("error", reject)
            .pipe(createWriteStream(FORM_DATA_FILE_PATH))
            .on("error", reject)
            .on("finish", resolve);
    });

    // Load the form data file from disk.
    log(`Load file ${formDataFileKey}`);
    const { form } = await loadJson<ExportedFormData>(FORM_DATA_FILE_PATH);

    log("Removing Directory for form...");
    await deleteFile(formKey);

    log(`Remove form contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    return form;
}
