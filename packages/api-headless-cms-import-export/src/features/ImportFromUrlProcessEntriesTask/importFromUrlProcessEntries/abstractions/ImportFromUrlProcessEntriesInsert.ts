import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./ImportFromUrlProcessEntries.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export type IImportFromUrlProcessEntriesInsertRunParams<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = TaskDefinition.RunParams<I, O>;

export type IImportFromUrlProcessEntriesInsertRunResult<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = TaskDefinition.Result<I, O>;

export interface IImportFromUrlProcessEntriesInsert<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> {
    run(
        params: IImportFromUrlProcessEntriesInsertRunParams<I, O>
    ): Promise<IImportFromUrlProcessEntriesInsertRunResult<I, O>>;
}
