import S3 from "aws-sdk/clients/s3";
import { Page, PageBlock, PageTemplate } from "@webiny/api-page-builder/types";
import { FileManagerContext, File } from "@webiny/api-file-manager/types";
import get from "lodash/get";
import Zipper from "./zipper";

export const EXPORT_PAGES_FOLDER_KEY = "WEBINY_PB_EXPORT_PAGES";
export const EXPORT_BLOCKS_FOLDER_KEY = "WEBINY_PB_EXPORT_BLOCK";
export const EXPORT_TEMPLATES_FOLDER_KEY = "WEBINY_PB_EXPORT_TEMPLATE";

export interface ExportedPageData {
    page: Pick<Page, "content" | "title" | "version" | "status" | "settings" | "path">;
    files: File[];
}

export async function exportPage(
    page: Page,
    exportPagesDataKey: string,
    fileManager: FileManagerContext["fileManager"]
): Promise<S3.ManagedUpload.SendData> {
    // Extract all files
    const files = extractFilesFromData(page.content || {});
    // Extract images from page settings
    const pageSettingsImages = [
        get(page, "settings.general.image") as unknown as File,
        get(page, "settings.social.image") as unknown as File
    ].filter(image => image && image.src);

    const fileIds = [...files, ...pageSettingsImages].map(imageFile => imageFile.id);
    // Get file data for all images
    const imageFilesData = [];
    if (fileIds.length > 0) {
        const [filesData] = await fileManager.files.listFiles({ ids: fileIds });
        imageFilesData.push(...filesData);
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
        files: imageFilesData
    };
    const pageDataBuffer = Buffer.from(JSON.stringify(pageData));

    const zipper = new Zipper({
        exportInfo: {
            files: imageFilesData,
            name: page.title,
            dataBuffer: pageDataBuffer
        },
        archiveFileKey: exportPagesDataKey
    });

    return zipper.process();
}

export interface ExportedBlockData {
    block: Pick<PageBlock, "name" | "content" | "preview">;
    files: File[];
}

export async function exportBlock(
    block: PageBlock,
    exportBlocksDataKey: string,
    fileManager: FileManagerContext["fileManager"]
): Promise<S3.ManagedUpload.SendData> {
    // Extract all files
    const files = extractFilesFromData(block.content || {});
    const fileIds = files.map(imageFile => imageFile.id);
    // Get file data for all images
    const imageFilesData = [];
    if (fileIds.length > 0) {
        const [filesData] = await fileManager.files.listFiles({ ids: fileIds });
        imageFilesData.push(...filesData);
    }
    // Add block preview image file data
    if (block.preview.id) {
        imageFilesData.push(await fileManager.files.getFile(block.preview.id));
    }

    // Extract the block data in a json file and upload it to S3
    const blockData = {
        block: {
            name: block.name,
            content: block.content,
            preview: block.preview
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

export interface ExportedTemplateData {
    template: Pick<PageTemplate, "title" | "description" | "content">;
    files: File[];
}

export async function exportTemplate(
    template: PageTemplate,
    exportTemplatesDataKey: string,
    fileManager: FileManagerContext["fileManager"]
): Promise<S3.ManagedUpload.SendData> {
    // Extract all files
    const files = extractFilesFromData(template.content || {});
    const fileIds = files.map(imageFile => imageFile.id);
    // Get file data for all images
    const imageFilesData = [];
    if (fileIds.length > 0) {
        const [filesData] = await fileManager.files.listFiles({ ids: fileIds });
        imageFilesData.push(...filesData);
    }

    // Extract the template data in a json file and upload it to S3
    const templateData = {
        template: {
            title: template.title,
            description: template.description,
            content: template.content
        },
        files: imageFilesData
    };
    const templateDataBuffer = Buffer.from(JSON.stringify(templateData));

    const zipper = new Zipper({
        exportInfo: {
            files: imageFilesData,
            name: template.title,
            dataBuffer: templateDataBuffer
        },
        archiveFileKey: exportTemplatesDataKey
    });

    return zipper.process();
}

export function extractFilesFromData(data: Record<string, any>, files: any[] = []): File[] {
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
