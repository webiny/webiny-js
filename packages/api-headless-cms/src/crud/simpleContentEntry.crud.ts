import { CreateSimpleEntryUseCase } from "~/features/simpleContentEntries/createSimpleEntry/index.js";
import { UpdateSimpleEntryUseCase } from "~/features/simpleContentEntries/updateSimpleEntry/index.js";
import { GetSimpleEntryUseCase } from "~/features/simpleContentEntries/getSimpleEntry/index.js";
import { ListSimpleEntriesUseCase } from "~/features/simpleContentEntries/listSimpleEntries/index.js";
import { DeleteSimpleEntryUseCase } from "~/features/simpleContentEntries/deleteSimpleEntry/index.js";
import type {
    ICmsSimpleEntryContext,
    ICreateSimpleEntryInput,
    IGetSimpleEntryParams,
    IListSimpleEntriesParams,
    IUpdateSimpleEntryInput
} from "~/features/simpleContentEntries/types.js";
import type { CmsContext, CmsEntryValues, CmsModel } from "~/types/index.js";

interface CreateSimpleContentEntryCrudParams {
    context: CmsContext;
}

/**
 * Unwraps each use case's `Result` into throw-or-return, matching the regular entry CRUD. The
 * repositories, not this layer, are what enforce that the model is tagged simple.
 */
export const createSimpleContentEntryCrud = (
    params: CreateSimpleContentEntryCrudParams
): ICmsSimpleEntryContext => {
    const { context } = params;

    return {
        async simpleCreateEntry<TValues extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            input: ICreateSimpleEntryInput<TValues>
        ) {
            const result = await context.container
                .resolve(CreateSimpleEntryUseCase)
                .execute<TValues>(model, input);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },

        async simpleUpdateEntry<TValues extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            id: string,
            input: IUpdateSimpleEntryInput<TValues>
        ) {
            const result = await context.container
                .resolve(UpdateSimpleEntryUseCase)
                .execute<TValues>(model, id, input);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },

        async simpleGetEntry<TValues extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            getParams: IGetSimpleEntryParams
        ) {
            const result = await context.container
                .resolve(GetSimpleEntryUseCase)
                .execute<TValues>(model, getParams);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },

        async simpleListEntries<TValues extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            listParams?: IListSimpleEntriesParams
        ) {
            const result = await context.container
                .resolve(ListSimpleEntriesUseCase)
                .execute<TValues>(model, listParams);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },

        async simpleDeleteEntry(model: CmsModel, id: string) {
            const result = await context.container
                .resolve(DeleteSimpleEntryUseCase)
                .execute(model, id);
            if (result.isFail()) {
                throw result.error;
            }
        }
    };
};
