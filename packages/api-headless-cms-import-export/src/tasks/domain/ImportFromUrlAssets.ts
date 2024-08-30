import { ITaskRunParams, ITaskResponseResult } from "@webiny/tasks/types";
import {
    IImportFromUrlAssets,
    IImportFromUrlAssetsInput,
    IImportFromUrlAssetsOutput
} from "~/tasks/domain/abstractions/ImportFromUrlAssets";
import { Context } from "~/types";

export class ImportFromUrlAssets<
    C extends Context = Context,
    I extends IImportFromUrlAssetsInput = IImportFromUrlAssetsInput,
    O extends IImportFromUrlAssetsOutput = IImportFromUrlAssetsOutput
> implements IImportFromUrlAssets<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response } = params;

        return response.error({
            message: "Method to download assets file not implemented."
        });
    }
}
