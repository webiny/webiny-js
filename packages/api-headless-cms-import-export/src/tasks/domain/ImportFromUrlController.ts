import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import {
    IImportFromUrlController,
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { Context } from "~/types";

export class ImportFromUrlController<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements IImportFromUrlController<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response, input } = params;

        const { modelId, files } = input;

        return response.error(`Something went wrong: ${modelId} ${files}`);
    }
}
