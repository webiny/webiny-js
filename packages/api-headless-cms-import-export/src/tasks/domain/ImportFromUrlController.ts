import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import {
    IImportFromUrlController,
    IImportFromUrlControllerInput,
    IImportFromUrlControllerInputStep,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { Context } from "~/types";
import { ImportFromUrlControllerDownloadStep } from "~/tasks/domain/importFromUrlControllerSteps/ImportFromUrlControllerDownloadStep";
import { ImportFromUrlControllerProcessEntriesStep } from "./importFromUrlControllerSteps/ImportFromUrlControllerProcessEntriesStep";
import { ImportFromUrlControllerProcessAssetsStep } from "./importFromUrlControllerSteps/ImportFromUrlControllerProcessAssetsStep";

export class ImportFromUrlController<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements IImportFromUrlController<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input } = params;

        if (!input.modelId) {
            return response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (Array.isArray(input.files) === false || input.files.length === 0) {
            return response.error({
                message: `No files found in the provided data.`,
                code: "NO_FILES_FOUND"
            });
        }

        try {
            await context.cms.getModel(input.modelId);
        } catch (ex) {
            return response.error({
                message: `Model "${input.modelId}" not found.`,
                code: "MODEL_NOT_FOUND"
            });
        }

        const steps = input.steps || {};

        const downloadStep = steps[IImportFromUrlControllerInputStep.DOWNLOAD];
        if (!downloadStep?.done) {
            const step = new ImportFromUrlControllerDownloadStep<C, I, O>();
            return step.execute(params);
        }

        const processEntriesStep = steps[IImportFromUrlControllerInputStep.PROCESS_ENTRIES];
        if (!processEntriesStep?.done) {
            const step = new ImportFromUrlControllerProcessEntriesStep<C, I, O>();
            return step.execute(params);
        }

        const processAssetsStep = steps[IImportFromUrlControllerInputStep.PROCESS_ASSETS];
        if (!processAssetsStep?.done) {
            const step = new ImportFromUrlControllerProcessAssetsStep<C, I, O>();
            return step.execute(params);
        }

        return response.error("Should not reach this point.");
    }
}
