import { IMPORT_FROM_URL_PROCESS_ASSETS_TASK } from "~/tasks/constants";
import { createTaskDefinition } from "@webiny/tasks";
import type { Context } from "~/types";
import type {
    IImportFromUrlProcessAssetsInput,
    IImportFromUrlProcessAssetsOutput
} from "./domain/importFromUrlProcessAssets/abstractions/ImportFromUrlProcessAssets";

export const createImportFromUrlProcessAssetsTask = () => {
    return createTaskDefinition<
        Context,
        IImportFromUrlProcessAssetsInput,
        IImportFromUrlProcessAssetsOutput
    >({
        id: IMPORT_FROM_URL_PROCESS_ASSETS_TASK,
        title: "Import from URL List - Process entries",
        maxIterations: 10,
        isPrivate: true,
        description: "Process entries import.",
        async run(params) {
            const { createImportFromUrlProcessAssets } = await import(
                /* webpackChunkName: "createImportFromUrlProcessAssets" */ "./domain/createImportFromUrlProcessAssets"
            );

            try {
                const runner = createImportFromUrlProcessAssets();
                return await runner.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};
