import { createTaskDefinition } from "@webiny/tasks";
import { IMPORT_FROM_URL_CONTROLLER_TASK } from "./constants";
import { Context } from "~/types";
import {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";

export const createImportFromUrlTask = () => {
    return createTaskDefinition<
        Context,
        IImportFromUrlControllerInput,
        IImportFromUrlControllerOutput
    >({
        id: IMPORT_FROM_URL_CONTROLLER_TASK,
        title: "Import from URL List - Controller",
        maxIterations: 1,
        isPrivate: true,
        description: "Imports the data from the given URL list.",
        async run(params) {
            const { ImportFromUrlController } = await import(
                /* webpackChunkName: "createValidateImportFromUrl" */ "./domain/ImportFromUrlController"
            );

            try {
                const runner = new ImportFromUrlController();
                return await runner.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};
