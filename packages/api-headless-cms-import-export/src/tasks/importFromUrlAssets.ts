import { IMPORT_FROM_URL_ASSETS_TASK } from "~/tasks/constants";
import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "~/types";
import {
    IImportFromUrlAssetsInput,
    IImportFromUrlAssetsOutput
} from "~/tasks/domain/abstractions/ImportFromUrlAssets";

export const createImportFromUrlAssetsTask = () => {
    return createTaskDefinition<Context, IImportFromUrlAssetsInput, IImportFromUrlAssetsOutput>({
        id: IMPORT_FROM_URL_ASSETS_TASK,
        title: "Import from URL List - Assets.",
        maxIterations: 500,
        isPrivate: true,
        description: "Imports the data from the given URL list - assets.",
        async run(params) {
            const { ImportFromUrlAssets } = await import(
                /* webpackChunkName: "ImportFromUrlAssets" */ "./domain/ImportFromUrlAssets"
            );

            try {
                const runner = new ImportFromUrlAssets();
                return await runner.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};
