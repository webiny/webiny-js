import S3 from "aws-sdk/clients/s3";
import { Page, File } from "@webiny/api-page-builder/types";
import { s3Stream } from "./s3Stream";
import Zipper from "./zipper";

export const EXPORT_PAGES_FOLDER_KEY = "WEBINY_PB_EXPORT_PAGES";

export async function exportPage(
    page: Page,
    exportPagesDataKey: string
): Promise<S3.ManagedUpload.SendData> {
    // Extract all files
    const files = extractFilesFromPageData(page.content);
    // Filter files
    const filesAvailableForDownload = [];
    const uniqueFileKeys = new Map<string, boolean>();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Check file accessibility
        if ((await s3Stream.isFileAccessible(file.key)) && !uniqueFileKeys.has(file.key)) {
            filesAvailableForDownload.push(file);
            uniqueFileKeys.set(file.key, true);
        }
    }

    // Extract the page data in a json file and upload it to S3
    const pageData = {
        page: {
            content: page.content,
            title: page.title,
            version: page.version,
            status: page.status
        },
        files: filesAvailableForDownload
    };
    const pageDataBuffer = Buffer.from(JSON.stringify(pageData));

    const zipper = new Zipper({
        exportInfo: {
            files: filesAvailableForDownload,
            pageTitle: page.title,
            pageDataBuffer
        },
        archiveFileKey: exportPagesDataKey
    });

    return zipper.process();
}

export interface ImageFile extends File {
    key: string;
}

export function extractFilesFromPageData(
    data: Record<string, any>,
    files: any[] = []
): ImageFile[] {
    // Base case: termination
    if (!data || typeof data !== "object") {
        return files;
    }
    // Recursively call function for each element
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            extractFilesFromPageData(element, files);
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
            extractFilesFromPageData(value, files);
        }
    }
    return files;
}
