import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import {
    IImportFromUrlController,
    IImportFromUrlControllerInput,
    IImportFromUrlControllerInputStep,
    IImportFromUrlControllerInputStepsStep,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import type { Context } from "~/types";
import { ImportFromUrlControllerDownloadStep } from "~/tasks/domain/importFromUrlControllerSteps/ImportFromUrlControllerDownloadStep";
import { ImportFromUrlControllerProcessEntriesStep } from "./importFromUrlControllerSteps/ImportFromUrlControllerProcessEntriesStep";
import { ImportFromUrlControllerProcessAssetsStep } from "./importFromUrlControllerSteps/ImportFromUrlControllerProcessAssetsStep";

const getDefaultStepValues = (): IImportFromUrlControllerInputStepsStep => {
    return {
        files: [],
        triggered: false,
        finished: false,
        done: [],
        failed: [],
        invalid: [],
        aborted: []
    };
};

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

        if (!input.steps) {
            input.steps = {};
        }

        const downloadStep =
            input.steps[IImportFromUrlControllerInputStep.DOWNLOAD] || getDefaultStepValues();

        if (!downloadStep.finished) {
            const step = new ImportFromUrlControllerDownloadStep<C, I, O>();
            return await step.execute(params);
        } else if (downloadStep.failed.length) {
            return response.error({
                message: `Failed to download files.`,
                code: "FAILED_DOWNLOADING_FILES",
                data: input.steps
            });
        }

        const processEntriesStep =
            input.steps[IImportFromUrlControllerInputStep.PROCESS_ENTRIES] ||
            getDefaultStepValues();
        if (!processEntriesStep.finished) {
            const step = new ImportFromUrlControllerProcessEntriesStep<C, I, O>();
            return await step.execute(params);
        } else if (processEntriesStep.failed.length) {
            return response.error({
                message: `Failed to process entries.`,
                code: "FAILED_PROCESSING_ENTRIES",
                data: input.steps
            });
        }

        const processAssetsStep =
            input.steps[IImportFromUrlControllerInputStep.PROCESS_ASSETS] || getDefaultStepValues();
        if (!processAssetsStep.finished) {
            const step = new ImportFromUrlControllerProcessAssetsStep<C, I, O>();
            return await step.execute(params);
        } else if (processAssetsStep.failed.length) {
            return response.error({
                message: `Failed to process assets.`,
                code: "FAILED_PROCESSING_ASSETS",
                data: input.steps
            });
        }

        const files = downloadStep.files
            .concat(processEntriesStep.files)
            .concat(processAssetsStep.files);

        const output: IImportFromUrlControllerOutput = {
            files,
            done: [],
            invalid: [],
            failed: [],
            aborted: []
        };

        return response.done(output as O);
    }
}
