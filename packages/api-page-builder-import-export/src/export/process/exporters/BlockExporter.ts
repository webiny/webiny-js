import { BlockCategory, PageBlock } from "@webiny/api-page-builder/types";
import { File, FileManagerContext } from "@webiny/api-file-manager/types";
import Zipper from "~/export/zipper";
import { extractFilesFromData } from "~/export/utils";

export interface ExportedBlockData {
    block: Pick<PageBlock, "name" | "content" | "preview">;
    category: BlockCategory;
    files: File[];
}

export class BlockExporter {
    private fileManager: FileManagerContext["fileManager"];

    constructor(fileManager: FileManagerContext["fileManager"]) {
        this.fileManager = fileManager;
    }

    async execute(block: PageBlock, blockCategory: BlockCategory, exportBlocksDataKey: string) {
        // Extract all files
        const files = extractFilesFromData(block.content || {});
        const fileIds = files.map(imageFile => imageFile.id);
        // Get file data for all images
        const imageFilesData = [];
        if (fileIds.length > 0) {
            const [filesData] = await this.fileManager.listFiles({ where: { id_in: fileIds } });
            imageFilesData.push(...filesData);
        }
        // Add block preview image file data
        if (block.preview.id) {
            const previewImage = await this.getPreviewImageFile(block);
            if (previewImage) {
                imageFilesData.push(previewImage);
                block.preview.id = previewImage.id;
            }
        }

        // Extract the block data in a json file and upload it to S3
        const blockData = {
            block: {
                name: block.name,
                content: block.content,
                preview: block.preview
            },
            category: {
                name: blockCategory.name,
                slug: blockCategory.slug,
                icon: blockCategory.icon,
                description: blockCategory.description
            },
            files: imageFilesData
        };
        const blockDataBuffer = Buffer.from(JSON.stringify(blockData));

        const zipper = new Zipper({
            exportInfo: {
                files: imageFilesData,
                name: block.name,
                dataBuffer: blockDataBuffer
            },
            archiveFileKey: exportBlocksDataKey
        });

        return zipper.process();
    }

    private async getPreviewImageFile(block: PageBlock): Promise<File | undefined> {
        // For BC, we need to check 2 IDs: the preview `id` and the `id` from the file URL.
        const idFromSrc = block.preview.src?.split("/files/")[1].split("/")[0];
        const possibleIds = [block.preview.id, idFromSrc].filter(Boolean);

        const [files] = await this.fileManager.listFiles({
            where: { id_in: possibleIds, meta: { private: true } }
        });

        return files[0];
    }
}
