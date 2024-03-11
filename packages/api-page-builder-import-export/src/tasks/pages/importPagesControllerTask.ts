import { createPrivateTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import {
    IImportPagesControllerInput,
    IImportPagesControllerOutput,
    PageImportTask
} from "~/import/pages/types";

export const createImportPagesControllerTask = () => {
    return createPrivateTaskDefinition<
        PbImportExportContext,
        IImportPagesControllerInput,
        IImportPagesControllerOutput
    >({
        id: PageImportTask.Controller,
        title: "Page Builder - Import Pages Controlelr",
        description: "Import pages from the Page Builder.",
        /**
         * We want to have a lot of executions because we need to pool the subtasks all the time.
         */
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }
            const { ImportPagesController } = await import(
                /* webpackChunkName: "ImportPagesController" */ "~/import/pages/ImportPagesController"
            );

            const importPagesController = new ImportPagesController();

            return await importPagesController.execute(params);
        }
    });
};
