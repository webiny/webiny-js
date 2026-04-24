import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./ImportFromUrlProcessEntries.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export type IImportFromUrlProcessEntriesDecompressRunParams<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = TaskDefinition.RunParams<I, O>;

export type IImportFromUrlProcessEntriesDecompressRunResult<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = TaskDefinition.Result<I, O>;

export interface IImportFromUrlProcessEntriesDecompress<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> {
    run(
        params: IImportFromUrlProcessEntriesDecompressRunParams<I, O>
    ): Promise<IImportFromUrlProcessEntriesDecompressRunResult<I, O>>;
}
