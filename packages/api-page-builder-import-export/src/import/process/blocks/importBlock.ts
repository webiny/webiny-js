import path from "path";
import dotProp from "dot-prop-immutable";
import loadJson from "load-json-file";
import { ensureDirSync, createWriteStream } from "fs-extra";
import { PbImportExportContext } from "~/graphql/types";
import { FileUploadsData } from "~/types";
import { PageBlock } from "@webiny/api-page-builder/types";
import { s3Stream } from "~/export/s3Stream";
import { uploadAssets } from "~/import/utils/uploadAssets";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { deleteS3Folder } from "~/import/utils/deleteS3Folder";
import { updateFilesInData } from "~/import/utils/updateFilesInData";
import { INSTALL_EXTRACT_DIR } from "~/import/constants";
import { ExportedBlockData } from "~/export/process/exporters/BlockExporter";

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
}: ImportBlockParams): Promise<Pick<PageBlock, "name" | "content" | "blockCategory">> {
    const log = console.log;

    // Making Directory for block in which we're going to extract the block data file.
    const BLOCK_EXTRACT_DIR = path.join(INSTALL_EXTRACT_DIR, blockKey);
    ensureDirSync(BLOCK_EXTRACT_DIR);

    const blockDataFileKey = dotProp.get(fileUploadsData, `data`);
    const BLOCK_DATA_FILE_PATH = path.join(BLOCK_EXTRACT_DIR, path.basename(blockDataFileKey));

    log(`Downloading Block data file: ${blockDataFileKey} at "${BLOCK_DATA_FILE_PATH}"`);
    // Download and save block data file in disk.
    const readStream = await s3Stream.readStream(blockDataFileKey);
    const writeStream = createWriteStream(BLOCK_DATA_FILE_PATH);

    await new Promise((resolve, reject) => {
        readStream.on("error", reject).pipe(writeStream).on("finish", resolve).on("error", reject);
    });

    // Load the block data file from disk.
    log(`Load file ${blockDataFileKey}`);
    const { block, category, files } = await loadJson<ExportedBlockData>(BLOCK_DATA_FILE_PATH);

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

        const settings = await context.fileManager.getSettings();

        const { srcPrefix = "" } = settings || {};
        updateFilesInData({
            data: block.content || {},
            fileIdToNewFileMap,
            srcPrefix
        });
    }

    let loadedCategory;
    if (category) {
        loadedCategory = await context.pageBuilder.getBlockCategory(category?.slug);
        if (!loadedCategory) {
            loadedCategory = await context.pageBuilder.createBlockCategory({
                name: category.name,
                slug: category.slug,
                icon: category.icon,
                description: category.description
            });
        }
    } else {
        let importedBlocksCategory = await context.pageBuilder.getBlockCategory("imported-blocks");

        if (!importedBlocksCategory) {
            importedBlocksCategory = await context.pageBuilder.createBlockCategory({
                name: "Imported Blocks",
                slug: "imported-blocks",
                description: "Imported blocks",
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                }
            });
        }

        loadedCategory = importedBlocksCategory;
    }

    log("Removing Directory for block...");
    await deleteFile(blockKey);

    log(`Remove block contents from S3...`);
    await deleteS3Folder(path.dirname(fileUploadsData.data));

    return { ...block, blockCategory: loadedCategory!.slug };
}
