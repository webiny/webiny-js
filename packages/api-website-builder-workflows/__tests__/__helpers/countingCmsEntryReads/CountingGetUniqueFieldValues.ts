import type { Container } from "@webiny/di";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetUniqueFieldValuesUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetUniqueFieldValues/index.js";
import { cmsEntryReads } from "./cmsEntryReads.js";

class CountingGetUniqueFieldValues implements GetUniqueFieldValuesUseCase.Interface {
    public constructor(private decoratee: GetUniqueFieldValuesUseCase.Interface) {}

    public execute(
        model: CmsModel,
        params: GetUniqueFieldValuesUseCase.Params
    ): GetUniqueFieldValuesUseCase.Return {
        cmsEntryReads.getUniqueFieldValues++;
        return this.decoratee.execute(model, params);
    }
}

/** Counts every `GetUniqueFieldValuesUseCase` call into `cmsEntryReads`. */
export const countGetUniqueFieldValuesReads = (container: Container): void => {
    container.registerDecorator(
        GetUniqueFieldValuesUseCase.createDecorator({
            decorator: CountingGetUniqueFieldValues,
            dependencies: []
        })
    );
};
