import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { IMPORT_FROM_URL_DOWNLOAD_TASK } from "~/tasks/constants.js";
import type { Context } from "~/types.js";
import type {
    IImportFromUrlDownloadInput,
    IImportFromUrlDownloadOutput
} from "~/tasks/domain/abstractions/ImportFromUrlDownload.js";

type IRunParams = TaskDefinition.RunParams<
    IImportFromUrlDownloadInput,
    IImportFromUrlDownloadOutput
>;

class ImportFromUrlDownloadTaskDefinition
    implements TaskDefinition.Interface<IImportFromUrlDownloadInput, IImportFromUrlDownloadOutput>
{
    id = IMPORT_FROM_URL_DOWNLOAD_TASK;
    title = "Import from URL List - Download";
    maxIterations = 500;
    isPrivate = true;
    description = "Downloads the files from external URL.";

    constructor(private context: CmsContext.Interface) {}

    async run(params: IRunParams) {
        const { ImportFromUrlDownload } = await import("./ImportFromUrlDownload.js");

        try {
            const runner = new ImportFromUrlDownload(this.context as Context);
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const ImportFromUrlDownloadTask = TaskDefinition.createImplementation({
    implementation: ImportFromUrlDownloadTaskDefinition,
    dependencies: [CmsContext]
});
