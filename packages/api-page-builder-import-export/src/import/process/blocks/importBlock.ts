import path from "path";
import dotProp from "dot-prop-immutable";
import loadJson from "load-json-file";
import { ensureDirSync, createWriteStream } from "fs-extra";
import { FileInput } from "@webiny/api-file-manager/types";
import { PbImportExportContext } from "~/graphql/types";
import { File as ImageFile, FileUploadsData } from "~/types";
import { ExportedBlockData } from "~/export/utils";
import { s3Stream } from "~/export/s3Stream";
import { uploadAssets } from "~/import/utils/uploadAssets";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { deleteS3Folder } from "~/import/utils/deleteS3Folder";
import { updateFilesInData } from "~/import/utils/updateFilesInData";
import { INSTALL_EXTRACT_DIR } from "~/import/constants";

interface ImportBlockParams {
    key: string;
    blockKey: string;
    context: PbImportExportContext;
    fileUploadsData: FileUploadsData;
}

interface UpdateBlockPreviewImage {
    fileIdToNewFileMap: Map<string, FileInput>;
    srcPrefix: string;
    file: ImageFile;
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
        const fileIdToNewFileMap = await uploadAssets({
            context,
            files,
            fileUploadsData
        });

        console.log(
            "After uploadAssets:fileIdToNewFileMap",
            JSON.stringify(Object.fromEntries(fileIdToNewFileMap))
        );

        const settings = await context.fileManager.settings.getSettings();

        const { srcPrefix = "" } = settings || {};
        updateFilesInData({
            data: block.content || {},
            fileIdToNewFileMap,
            srcPrefix
        });

        block.preview = updateBlockPreviewImage({
            file: block.preview || {},
            fileIdToNewFileMap,
            srcPrefix
        });
    }

    log("Removing Directory for block...");
    await deleteFile(blockKey);

    log(`Remove block contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    console.log("block", JSON.stringify(block, null, 2));

    return block;
}

function updateBlockPreviewImage(params: UpdateBlockPreviewImage): ImageFile {
    const { file: blockPreview, fileIdToNewFileMap, srcPrefix } = params;
    const newFile = fileIdToNewFileMap.get(blockPreview.id || "");

    console.log("updateBlockPreviewImage", blockPreview.id, newFile);

    if (!newFile) {
        console.log("Block preview file not found!");
        return blockPreview;
    }

    const srcPrefixWithoutTrailingSlash = srcPrefix.endsWith("/")
        ? srcPrefix.slice(0, -1)
        : srcPrefix;

    blockPreview.src = `${srcPrefixWithoutTrailingSlash}/${newFile.key}`;

    return blockPreview;
}
