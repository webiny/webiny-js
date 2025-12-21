import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ImportFromUrlControllerStep<
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> {
    execute(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
