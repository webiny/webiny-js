import {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./ImportFromUrlProcessEntries";
import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";

export type IImportFromUrlProcessEntriesInsertRunParams<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = ITaskRunParams<C, I, O>;

export type IImportFromUrlProcessEntriesInsertRunResult<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> = ITaskResponseResult<I, O>;

export interface IImportFromUrlProcessEntriesInsert<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> {
    run(
        params: IImportFromUrlProcessEntriesInsertRunParams<C, I, O>
    ): Promise<IImportFromUrlProcessEntriesInsertRunResult<I, O>>;
}
