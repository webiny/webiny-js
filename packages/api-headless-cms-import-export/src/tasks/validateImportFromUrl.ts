import { createTaskDefinition } from "@webiny/tasks";
import { VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK } from "./constants";
import type { Context } from "~/types";
import type {
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl";

export const createValidateImportFromUrlTask = () => {
    return createTaskDefinition<Context, IValidateImportFromUrlInput, IValidateImportFromUrlOutput>(
        {
            id: VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK,
            title: "Validate Import from URL Integrity",
            maxIterations: 1,
            isPrivate: true,
            description:
                "Validates given URLs to verify that they are what we need to import the data.",
            async run(params) {
                const { createValidateImportFromUrl } = await import(
                    /* webpackChunkName: "createValidateImportFromUrl" */ "./domain/createValidateImportFromUrl"
                );

                try {
                    const runner = createValidateImportFromUrl();
                    return await runner.run(params);
                } catch (ex) {
                    return params.response.error(ex);
                }
            }
        }
    );
};
