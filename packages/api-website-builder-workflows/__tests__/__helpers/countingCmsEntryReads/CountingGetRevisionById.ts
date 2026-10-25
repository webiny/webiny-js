import type { Container } from "@webiny/di";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { cmsEntryReads } from "./cmsEntryReads.js";

class CountingGetRevisionById implements GetRevisionByIdUseCase.Interface {
    public constructor(private decoratee: GetRevisionByIdUseCase.Interface) {}

    public execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): GetRevisionByIdUseCase.Return<T> {
        cmsEntryReads.getRevisionById++;
        return this.decoratee.execute<T>(model, id);
    }
}

/** Counts every `GetRevisionByIdUseCase` call into `cmsEntryReads`. */
export const countGetRevisionByIdReads = (container: Container): void => {
    container.registerDecorator(
        GetRevisionByIdUseCase.createDecorator({
            decorator: CountingGetRevisionById,
            dependencies: []
        })
    );
};
