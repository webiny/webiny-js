import path from "path";
import dotProp from "dot-prop-immutable";
import loadJson from "load-json-file";
import { createWriteStream, ensureDirSync } from "fs-extra";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { FileInput } from "@webiny/api-file-manager/types";
import { PageSettings } from "@webiny/api-page-builder/types";
import { PbImportExportContext } from "~/graphql/types";
import { FileUploadsData } from "~/types";
import { INSTALL_EXTRACT_DIR } from "~/import/constants";
import { s3Stream } from "~/export/s3Stream";
import { deleteS3Folder, updateFilesInData, uploadAssets } from "~/import/utils";
import { ExportedPageData } from "~/export/process/exporters/PageExporter";

interface ImportPageParams {
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
    const readStream = await s3Stream.readStream(pageDataFileKey);
    const writeStream = createWriteStream(PAGE_DATA_FILE_PATH);

    await new Promise((resolve, reject) => {
        readStream.on("error", reject).pipe(writeStream).on("finish", resolve).on("error", reject);
    });

    // Load the page data file from disk.
    log(`Load file ${pageDataFileKey}`);
    const { page, files } = await loadJson<ExportedPageData>(PAGE_DATA_FILE_PATH);

    // Only update page data if there are files.
    if (files && Array.isArray(files) && files.length > 0) {
        const fileIdToNewFileMap = await uploadAssets({
            context,
            files,
            fileUploadsData
        });

        const settings = await context.fileManager.getSettings();

        const { srcPrefix = "" } = settings || {};
        updateFilesInData({
            data: page.content || {},
            fileIdToNewFileMap,
            srcPrefix
        });

        page.settings = updateImageInPageSettings({
            settings: page.settings || {},
            fileIdToNewFileMap,
            srcPrefix
        });
    }

    log("Removing Directory for page...");
    await deleteFile(pageKey);

    log(`Remove page contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    return page;
}

interface UpdateImageInPageSettingsParams {
    fileIdToNewFileMap: Map<string, FileInput>;
    srcPrefix: string;
    settings: PageSettings;
}

function updateImageInPageSettings(
    params: UpdateImageInPageSettingsParams
): UpdateImageInPageSettingsParams["settings"] {
    const { settings, fileIdToNewFileMap, srcPrefix } = params;
    let newSettings = settings;

    const cleanSrcPrefix = srcPrefix.endsWith("/") ? srcPrefix.slice(0, -1) : srcPrefix;

    if (dotProp.get(newSettings, "general.image.src")) {
        const newFile = fileIdToNewFileMap.get(settings.general?.image?.id || "");
        if (newFile) {
            newSettings = dotProp.set(
                newSettings,
                "general.image.src",
                `${cleanSrcPrefix}/${newFile.key}`
            );
        }
    }

    if (dotProp.get(newSettings, "social.image.src")) {
        const newFile = fileIdToNewFileMap.get(settings.social?.image?.id || "");

        if (newFile) {
            newSettings = dotProp.set(
                newSettings,
                "social.image.src",
                `${cleanSrcPrefix}/${newFile.key}`
            );
        }
    }

    return newSettings;
}
