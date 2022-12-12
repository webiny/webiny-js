import S3 from "aws-sdk/clients/s3";
import { Page, PageBlock, File } from "@webiny/api-page-builder/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import get from "lodash/get";
import { s3Stream } from "./s3Stream";
import Zipper from "./zipper";

export const EXPORT_PAGES_FOLDER_KEY = "WEBINY_PB_EXPORT_PAGES";
export const EXPORT_BLOCKS_FOLDER_KEY = "WEBINY_PB_EXPORT_BLOCK";

async function getFilteredFiles(files: ImageFile[]) {
    const uniqueFileKeys = new Map<string, boolean>();
    const promises = files.map(file => s3Stream.isFileAccessible(file.key));
    const isFileAvailableResults = await Promise.all(promises);

    const filesAvailableForDownload = [];
    // Filter files
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Check file accessibility
        if (isFileAvailableResults[i] && !uniqueFileKeys.has(file.key)) {
            filesAvailableForDownload.push(file);
            uniqueFileKeys.set(file.key, true);
        }
    }
    return filesAvailableForDownload;
}

export interface ExportedPageData {
    page: Pick<Page, "content" | "title" | "version" | "status" | "settings" | "path">;
    files: ImageFile[];
}

export async function exportPage(
    page: Page,
    exportPagesDataKey: string,
    fileManager: FileManagerContext["fileManager"]
): Promise<S3.ManagedUpload.SendData> {
    // Extract all files
    const files = extractFilesFromData(page.content || {});
    // Filter files
    const filesAvailableForDownload = await getFilteredFiles(files);
    // Extract images from page settings
    const pageSettingsImages = [
        get(page, "settings.general.image") as unknown as File,
        get(page, "settings.social.image") as unknown as File
    ].filter(image => image && image.src);
    const pageSettingsImagesData = [];
    // Get file data for all images inside "page.settings"
    for (let i = 0; i < pageSettingsImages.length; i++) {
        const { id } = pageSettingsImages[i];
        const file = await fileManager.files.getFile(id);
        pageSettingsImagesData.push(file);
    }

    // Extract the page data in a json file and upload it to S3
    const pageData = {
        page: {
            content: page.content,
            title: page.title,
            path: page.path,
            version: page.version,
            status: page.status,
            settings: page.settings
        },
        files: [...filesAvailableForDownload, ...pageSettingsImagesData]
    };
    const pageDataBuffer = Buffer.from(JSON.stringify(pageData));

    const zipper = new Zipper({
        exportInfo: {
            files: [...filesAvailableForDownload, ...pageSettingsImagesData],
            name: page.title,
            dataBuffer: pageDataBuffer
        },
        archiveFileKey: exportPagesDataKey
    });

    return zipper.process();
}

export interface ExportedBlockData {
    block: Pick<PageBlock, "name" | "content" | "preview">;
    files: ImageFile[];
}

export async function exportBlock(
    block: PageBlock,
    exportBlocksDataKey: string
): Promise<S3.ManagedUpload.SendData> {
    // Extract all files
    const files = extractFilesFromData(block.content || {});
    // Filter files
    const filesAvailableForDownload = await getFilteredFiles(files);

    // Extract the block data in a json file and upload it to S3
    const blockData = {
        block: {
            name: block.name,
            content: block.content,
            preview: block.preview
        },
        files: filesAvailableForDownload
    };
    const blockDataBuffer = Buffer.from(JSON.stringify(blockData));

    const zipper = new Zipper({
        exportInfo: {
            files: filesAvailableForDownload,
            name: block.name,
            dataBuffer: blockDataBuffer
        },
        archiveFileKey: exportBlocksDataKey
    });

    return zipper.process();
}

export interface ImageFile extends Omit<File, "src"> {
    key: string;
}

export function extractFilesFromData(data: Record<string, any>, files: any[] = []): ImageFile[] {
    // Base case: termination
    if (!data || typeof data !== "object") {
        return files;
    }
    // Recursively call function for each element
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            extractFilesFromData(element, files);
        }
        return files;
    }

    // Main
    const tuple = Object.entries(data);
    for (let i = 0; i < tuple.length; i++) {
        const [key, value] = tuple[i];
        // TODO: @ashutosh extract it to plugins, so that, we can handle cases for other components too.
        if (key === "file" && value) {
            files.push(value);
        } else if (key === "images" && Array.isArray(value)) {
            // Handle case for "images-list" component
            files.push(...value);
        } else {
            extractFilesFromData(value, files);
        }
    }
    return files;
}
