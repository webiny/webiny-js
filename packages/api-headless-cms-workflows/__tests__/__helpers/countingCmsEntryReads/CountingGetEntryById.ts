import type { Container } from "@webiny/di";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { cmsEntryReads } from "./cmsEntryReads.js";

class CountingGetEntryById implements GetEntryByIdUseCase.Interface {
    public constructor(private decoratee: GetEntryByIdUseCase.Interface) {}

    public execute<T extends CmsEntryValues>(
        model: CmsModel,
        id: string
    ): GetEntryByIdUseCase.Return<T> {
        cmsEntryReads.getEntryById++;
        return this.decoratee.execute<T>(model, id);
    }
}

/** Counts every `GetEntryByIdUseCase` call into `cmsEntryReads`. */
export const countGetEntryByIdReads = (container: Container): void => {
    container.registerDecorator(
        GetEntryByIdUseCase.createDecorator({ decorator: CountingGetEntryById, dependencies: [] })
    );
};
