import type { Context } from "~/types";
import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";

export interface ImportFromUrlControllerStep<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> {
    execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
