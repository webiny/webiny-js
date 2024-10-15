import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./ImportFromUrlProcessEntries";
import type { Context } from "~/types";
import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";

export type IImportFromUrlProcessEntriesDecompressRunParams<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = ITaskRunParams<C, I, O>;

export type IImportFromUrlProcessEntriesDecompressRunResult<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = ITaskResponseResult<I, O>;

export interface IImportFromUrlProcessEntriesDecompress<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> {
    run(
        params: IImportFromUrlProcessEntriesDecompressRunParams<C, I, O>
    ): Promise<IImportFromUrlProcessEntriesDecompressRunResult<I, O>>;
}
