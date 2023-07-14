import { PageTemplate } from "@webiny/api-page-builder/types";
import { File, FileManagerContext } from "@webiny/api-file-manager/types";
import Zipper from "~/export/zipper";
import { extractFilesFromData } from "~/export/utils";

export interface ExportedTemplateData {
    template: Pick<
        PageTemplate,
        "title" | "slug" | "tags" | "description" | "content" | "layout" | "pageCategory"
    >;
    files: File[];
}

export class PageTemplateExporter {
    private fileManager: FileManagerContext["fileManager"];

    constructor(fileManager: FileManagerContext["fileManager"]) {
        this.fileManager = fileManager;
    }

    async execute(template: PageTemplate, exportTemplatesDataKey: string) {
        // Extract all files
        const files = extractFilesFromData(template.content || {});
        const fileIds = files.map(imageFile => imageFile.id);
        // Get file data for all images
        const imageFilesData = [];
        if (fileIds.length > 0) {
            const [filesData] = await this.fileManager.listFiles({ where: { id_in: fileIds } });
            imageFilesData.push(...filesData);
        }

        // Extract the template data in a json file and upload it to S3
        const templateData = {
            template: {
                title: template.title,
                slug: template.slug,
                tags: template.tags,
                description: template.description,
                content: template.content,
                layout: template.layout,
                pageCategory: template.pageCategory
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
}
