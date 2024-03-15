import get from "lodash/get";
import { Page } from "@webiny/api-page-builder/types";
import { File, FileManagerContext } from "@webiny/api-file-manager/types";
import Zipper from "~/export/zipper";
import { extractFilesFromData } from "~/export/utils";

export interface ExportedPageData {
    /**
     * TODO: is it really ok not to export whole page object?
     * What if we add some new properties in the future?
     *
     * Type of the exported page data is now created by removing unnecessary properties from the Page type.
     * This way TS will break if we add new property and forget to handle it in the export/import process.
     */
    page: Omit<
        Page,
        | "id"
        | "pid"
        | "tenant"
        | "locale"
        | "editor"
        | "category"
        | "createdFrom"
        | "createdBy"
        | "createdOn"
        | "savedOn"
        | "publishedOn"
        | "locked"
        | "ownedBy"
        | "webinyVersion"
    >;
    files: File[];
}

export class PageExporter {
    private fileManager: FileManagerContext["fileManager"];

    constructor(fileManager: FileManagerContext["fileManager"]) {
        this.fileManager = fileManager;
    }

    async execute(page: Page, exportPagesDataKey: string) {
        // Extract all files
        const files = extractFilesFromData(page.content || {});
        // Extract images from page settings
        const pageSettingsImages = [
            get(page, "settings.general.image") as unknown as File,
            get(page, "settings.social.image") as unknown as File
        ].filter(image => image && image.src);

        const fileIds = [...files, ...pageSettingsImages].map(imageFile => imageFile.id);
        // Get file data for all images
        const imageFilesData: File[] = [];
        if (fileIds.length > 0) {
            const [filesData] = await this.fileManager.listFiles({ where: { id_in: fileIds } });
            imageFilesData.push(...filesData);
        }

        // Extract the page data in a json file and upload it to S3
        const pageData: ExportedPageData = {
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
}
