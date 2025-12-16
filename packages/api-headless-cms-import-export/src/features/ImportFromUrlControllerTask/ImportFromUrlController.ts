import type {
    IImportFromUrlController,
    IImportFromUrlControllerInput,
    IImportFromUrlControllerInputStepsStep,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import { IImportFromUrlControllerInputStep } from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import type { Context } from "~/types.js";
import { ImportFromUrlControllerDownloadStep } from "~/tasks/domain/importFromUrlControllerSteps/ImportFromUrlControllerDownloadStep.js";
import { ImportFromUrlControllerProcessEntriesStep } from "~/tasks/domain/importFromUrlControllerSteps/ImportFromUrlControllerProcessEntriesStep.js";
import { ImportFromUrlControllerProcessAssetsStep } from "~/tasks/domain/importFromUrlControllerSteps/ImportFromUrlControllerProcessAssetsStep.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

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
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements IImportFromUrlController<I, O>
{
    constructor(private context: Context) {}

    public async run(params: TaskDefinition.RunParams<I, O>) {
        const { input, controller } = params;

        if (!input.modelId) {
            return controller.response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (Array.isArray(input.files) === false || input.files.length === 0) {
            return controller.response.error({
                message: `No files found in the provided data.`,
                code: "NO_FILES_FOUND"
            });
        }

        try {
            await this.context.cms.getModel(input.modelId);
        } catch {
            return controller.response.error({
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
            const step = new ImportFromUrlControllerDownloadStep<I, O>(this.context);
            return await step.execute({ input, controller });
        } else if (downloadStep.failed.length) {
            return controller.response.error({
                message: `Failed to download files.`,
                code: "FAILED_DOWNLOADING_FILES",
                data: input.steps
            });
        }

        const processEntriesStep =
            input.steps[IImportFromUrlControllerInputStep.PROCESS_ENTRIES] ||
            getDefaultStepValues();
        if (!processEntriesStep.finished) {
            const step = new ImportFromUrlControllerProcessEntriesStep<I, O>(this.context);
            return await step.execute(params);
        } else if (processEntriesStep.failed.length) {
            return controller.response.error({
                message: `Failed to process entries.`,
                code: "FAILED_PROCESSING_ENTRIES",
                data: input.steps
            });
        }

        const processAssetsStep =
            input.steps[IImportFromUrlControllerInputStep.PROCESS_ASSETS] || getDefaultStepValues();
        if (!processAssetsStep.finished) {
            const step = new ImportFromUrlControllerProcessAssetsStep<I, O>(this.context);
            return await step.execute(params);
        } else if (processAssetsStep.failed.length) {
            return controller.response.error({
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

        return controller.response.done(output as O);
    }
}
