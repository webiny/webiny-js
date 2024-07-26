import { createTaskDefinition } from "@webiny/tasks";
import { IMPORT_FROM_URL_CONTROLLER_TASK } from "./constants";
import { Context } from "~/types";
import {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";

export const createImportFromUrlControllerTask = () => {
    return createTaskDefinition<
        Context,
        IImportFromUrlControllerInput,
        IImportFromUrlControllerOutput
    >({
        id: IMPORT_FROM_URL_CONTROLLER_TASK,
        title: "Import from URL List - Controller",
        maxIterations: 500,
        isPrivate: true,
        description: "Imports the data from the given URL list - controller.",
        async run(params) {
            const { ImportFromUrlController } = await import(
                /* webpackChunkName: "ImportFromUrlController" */ "./domain/ImportFromUrlController"
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
