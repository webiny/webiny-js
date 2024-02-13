import {
    IImportPagesControllerTaskParams,
    IImportPagesProcessPagesInput,
    PageImportTask
} from "../types";
import { ITaskResponseResult } from "@webiny/tasks";
import { extractAndUploadZipFileContents } from "~/import/utils";
import lodashChunk from "lodash/chunk";

const PROCESSING_PAGES_PER_TASK = 5;

export class ImportPagesProcessZipFile {
    public async execute(params: IImportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const { response, input, trigger, store } = params;

        const { zipFileUrl } = input;
        if (!zipFileUrl) {
            return response.error({
                message: `Missing "zipFileUrl" in the input.`
            });
        }

        const items = await extractAndUploadZipFileContents(zipFileUrl);
        /**
         * We will trigger subtasks for a batch of pages.
         */
        if (items.length === 0) {
            return response.error({
                message: `No pages found in the provided zip file.`
            });
        }
        const chunks = lodashChunk(items, PROCESSING_PAGES_PER_TASK);

        for (const pages of chunks) {
            await trigger<IImportPagesProcessPagesInput>({
                definition: PageImportTask.Process,
                input: {
                    category: input.category,
                    meta: input.meta,
                    identity: input.identity,
                    items: pages,
                    done: [],
                    failed: [],
                    pageIdList: []
                }
            });
        }
        await store.updateOutput(
            {
                total: items.length
            },
            {
                save: false
            }
        );

        return response.continue(
            {
                ...input,
                processing: true
            },
            {
                /**
                 * We will wait a bit before we run controller again,
                 * because of Lambda cold starts.
                 */
                seconds: 10
            }
        );
    }
}
