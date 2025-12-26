import type {
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK } from "~/tasks/constants.js";

type IRunParams = TaskDefinition.RunParams<
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
>;

class ValidateImportFromUrlTaskDefinition
    implements TaskDefinition.Interface<IValidateImportFromUrlInput, IValidateImportFromUrlOutput>
{
    id = VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK;
    title = "Validate Import from URL Integrity";
    maxIterations = 1;
    isPrivate = true;
    description = "Validates given URLs to verify that they are what we need to import the data.";

    async run(params: IRunParams) {
        const { createValidateImportFromUrl } = await import(
            /* webpackChunkName: "createValidateImportFromUrl" */ "./createValidateImportFromUrl.js"
        );

        try {
            const runner = createValidateImportFromUrl();
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const ValidateImportFromUrlTask = TaskDefinition.createImplementation({
    implementation: ValidateImportFromUrlTaskDefinition,
    dependencies: []
});
