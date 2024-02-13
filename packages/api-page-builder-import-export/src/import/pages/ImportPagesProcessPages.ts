import { ITaskResponseResult } from "@webiny/tasks";
import { IImportPagesControllerInputMeta, IImportPagesProcessPagesTaskParams } from "./types";
import { importPage } from "./process/importPage";
import { mockSecurity } from "~/mockSecurity";
import { SecurityIdentity } from "@webiny/api-security/types";
import { ImportData } from "~/types";
import { Page } from "@webiny/api-page-builder/types";

interface ImportPageParams extends Pick<IImportPagesProcessPagesTaskParams, "context"> {
    identity: SecurityIdentity;
    item: ImportData;
    meta?: IImportPagesControllerInputMeta;
    category: string;
}

export class ImportPagesProcessPages {
    public async execute(params: IImportPagesProcessPagesTaskParams): Promise<ITaskResponseResult> {
        const { context, response, input, store, isAborted, isCloseToTimeout } = params;

        const { identity, items, meta, category } = input;

        const pageIdList = Array.from(input.pageIdList || []);
        const done = Array.from(input.done || []);
        const failed = Array.from(input.failed || []);

        for (const item of items) {
            /**
             * Possibility that a page was already imported in a execution run.
             */
            if (done.includes(item.key) || failed.includes(item.key)) {
                continue;
            } else if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input,
                    pageIdList,
                    done,
                    failed
                });
            }

            let page: Page;
            try {
                page = await this.importPage({
                    context,
                    identity,
                    item,
                    meta,
                    category
                });
                pageIdList.push(page.pid);
                done.push(item.key);
            } catch (ex) {
                await store.addErrorLog({
                    error: ex,
                    message: `Could not import page: ${item.key}.`,
                    data: {
                        ...item
                    }
                });
                failed.push(item.key);
                continue;
            }
            await store.addInfoLog({
                message: `Page "${page.title}" imported successfully.`,
                data: {
                    id: page.id,
                    title: page.title,
                    version: page.version,
                    status: page.status
                }
            });
        }

        return response.done({
            done,
            failed,
            pageIdList
        });
    }

    private async importPage(params: ImportPageParams) {
        const { context, identity, item, category, meta } = params;
        mockSecurity(identity, context);

        const page = await importPage({
            context,
            pageKey: item.key,
            fileUploadsData: {
                data: item.data,
                assets: item.assets
            }
        });

        const pbPage = await context.pageBuilder.createPage(category, meta);

        mockSecurity(identity, context);

        return await context.pageBuilder.updatePage(pbPage.id, {
            content: page.content,
            title: page.title,
            path: page.path,
            settings: page.settings
        });
    }
}
