import { BlockCategory, PageBlock } from "@webiny/api-page-builder/types";
import { File, FileManagerContext } from "@webiny/api-file-manager/types";
import Zipper from "~/export/zipper";
import { extractFilesFromData } from "~/export/utils";

export interface ExportedBlockData {
    block: Pick<PageBlock, "name" | "content">;
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

        // Extract the block data in a json file and upload it to S3
        const blockData = {
            block: {
                name: block.name,
                content: block.content
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
}
