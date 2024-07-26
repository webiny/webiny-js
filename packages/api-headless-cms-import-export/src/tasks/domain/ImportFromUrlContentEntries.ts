import { ITaskRunParams, ITaskResponseResult } from "@webiny/tasks/types";
import {
    IImportFromUrlContentEntries,
    IImportFromUrlContentEntriesInput,
    IImportFromUrlContentEntriesOutput
} from "~/tasks/domain/abstractions/ImportFromUrlContentEntries";
import { Context } from "~/types";

export class ImportFromUrlContentEntries<
    C extends Context = Context,
    I extends IImportFromUrlContentEntriesInput = IImportFromUrlContentEntriesInput,
    O extends IImportFromUrlContentEntriesOutput = IImportFromUrlContentEntriesOutput
> implements IImportFromUrlContentEntries<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response } = params;

        return response.error({
            message: "Method not implemented."
        });
    }
}
