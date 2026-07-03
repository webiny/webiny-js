import omit from "lodash/omit.js";
import WebinyError from "@webiny/error";
import { FILTER_MODEL_ID } from "./filter.model.js";
import type { HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { Container } from "@webiny/di";

interface CreateFilterOperationsParams {
    cms: HeadlessCms;
    identityContext: IdentityContext.Interface;
    container: Container;
}
import { createListSort } from "~/utils/createListSort.js";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper.js";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues.js";
import type { AcoFilterStorageOperations, Filter } from "./filter.types.js";
import { ENTRY_META_FIELDS } from "@webiny/api-headless-cms/constants.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";

export const createFilterOperations = (
    params: CreateFilterOperationsParams
): AcoFilterStorageOperations => {
    const { cms, identityContext, container } = params;

    const { withModel } = createOperationsWrapper({
        ...params,
        modelName: FILTER_MODEL_ID
    });

    const cmsWhereMapper = container.resolve(CmsWhereMapper);
    const cmsSortMapper = container.resolve(CmsSortMapper);

    return {
        getFilter({ id }) {
            return withModel(async model => {
                const entry = await cms.getEntryById(model, id);

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

                const [entries, meta] = await cms.listLatestEntries(model, {
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

                return [entries.map(pickEntryFieldValues<Filter>), meta];
            });
        },
        createFilter({ data }) {
            return withModel(async model => {
                const entry = await cms.createEntry(model, {
                    id: data.id,
                    values: data
                });
                return pickEntryFieldValues(entry);
            });
        },
        updateFilter({ id, data }) {
            return withModel(async model => {
                const original = await cms.getEntryById(model, id);

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

                const entry = await cms.updateEntry(model, original.id, input);
                return pickEntryFieldValues(entry);
            });
        },
        deleteFilter({ id }) {
            return withModel(async model => {
                await cms.deleteEntry(model, id);
                return true;
            });
        }
    };
};
