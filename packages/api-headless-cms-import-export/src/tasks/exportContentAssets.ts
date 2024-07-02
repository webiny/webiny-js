import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "~/types";
import {
    IExportContentAssetsInput,
    IExportContentAssetsOutput
} from "~/tasks/domain/abstractions/ExportContentAssets";
import { EXPORT_CONTENT_ASSETS_TASK } from "~/tasks/constants";

export const createExportContentAssets = () => {
    return createTaskDefinition<Context, IExportContentAssetsInput, IExportContentAssetsOutput>({
        id: EXPORT_CONTENT_ASSETS_TASK,
        title: "Export Content Assets",
        maxIterations: 50,
        isPrivate: true,
        description: "Export content assets from a specific model.",
        async run(params) {
            const { createExportContentAssets } = await import(
                /* webpackChunkName: "createExportContentAssets" */ "./domain/createExportContentAssets"
            );

            const runner = createExportContentAssets();

            try {
                return await runner.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};
