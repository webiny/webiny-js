import omit from "lodash/omit.js";
import WebinyError from "@webiny/error";
import { FILTER_MODEL_ID } from "./filter.model.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { Container } from "@webiny/di";

interface CreateFilterOperationsParams {
    identityContext: IdentityContext.Interface;
    container: Container;
}
import { createListSort } from "~/utils/createListSort.js";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper.js";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues.js";
import type { AcoFilterStorageOperations, Filter } from "./filter.types.js";
import { ENTRY_META_FIELDS } from "@webiny/api-headless-cms/constants.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import type { Result } from "@webiny/feature/api";

const unwrap = <TValue>(result: Result<TValue, Error>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export const createFilterOperations = (
    params: CreateFilterOperationsParams
): AcoFilterStorageOperations => {
    const { identityContext, container } = params;

    const { withModel } = createOperationsWrapper({
        identityContext,
        container,
        modelName: FILTER_MODEL_ID
    });

    /*
     * The CMS use cases are resolved when an operation runs, not here. These operations are built
     * while ACO's storage is being resolved, and resolving the use cases at this point loops back
     * into that same storage until the stack overflows.
     */

    const cmsWhereMapper = container.resolve(CmsWhereMapper);
    const cmsSortMapper = container.resolve(CmsSortMapper);

    return {
        getFilter({ id }) {
            return withModel(async model => {
                const entry = unwrap(
                    await container.resolve(GetEntryByIdUseCase).execute(model, id)
                );

                if (!entry) {
                    throw new WebinyError("Could not load filter.", "GET_FILTER_ERROR", {
                        id
                    });
                }

                return pickEntryFieldValues(entry);
            });
        },
        listFilters(params) {
            return withModel(async model => {
                const { sort, where } = params;
                const createdBy = identityContext.getIdentity().id;

                const result = await container.resolve(ListLatestEntriesUseCase).execute(model, {
                    ...params,
                    sort: cmsSortMapper.map({
                        input: createListSort(sort),
                        fields: model.fields
                    }),
                    where: cmsWhereMapper.map({
                        input: {
                            ...where,
                            createdBy
                        },
                        fields: model.fields
                    })
                });
                const { entries, meta } = unwrap(result);

                return [entries.map(pickEntryFieldValues<Filter>), meta];
            });
        },
        createFilter({ data }) {
            return withModel(async model => {
                const result = await container.resolve(CreateEntryUseCase).execute(model, {
                    id: data.id,
                    values: data
                });
                const entry = unwrap(result);
                return pickEntryFieldValues(entry);
            });
        },
        updateFilter({ id, data }) {
            return withModel(async model => {
                const original = unwrap(
                    await container.resolve(GetEntryByIdUseCase).execute(model, id)
                );

                const input = {
                    /**
                     *  We are omitting the standard entry meta fields:
                     *  we don't want to override them with the ones coming from the `original` entry.
                     */
                    ...omit(original, ENTRY_META_FIELDS),
                    values: {
                        ...original.values,
                        ...data
                    }
                };

                const entry = unwrap(
                    await container.resolve(UpdateEntryUseCase).execute(model, original.id, input)
                );
                return pickEntryFieldValues(entry);
            });
        },
        deleteFilter({ id }) {
            return withModel(async model => {
                unwrap(await container.resolve(DeleteEntryUseCase).execute(model, id));
                return true;
            });
        }
    };
};
