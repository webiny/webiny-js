import WebinyError from "@webiny/error";
import { FILTER_MODEL_ID } from "./filter.model";
import { CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { createListSort } from "~/utils/createListSort";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper";
import { getFilterFieldValues } from "~/utils/getFieldValues";
import { AcoFilterStorageOperations } from "./filter.types";

export const createFilterOperations = (
    params: CreateAcoStorageOperationsParams
): AcoFilterStorageOperations => {
    const { cms, security } = params;

    const { withModel } = createOperationsWrapper({
        ...params,
        modelName: FILTER_MODEL_ID
    });

    return {
        getFilter({ id }) {
            return withModel(async model => {
                const entry = await cms.getEntryById(model, id);

                if (!entry) {
                    throw new WebinyError("Could not load filter.", "GET_FILTER_ERROR", {
                        id
                    });
                }

                return getFilterFieldValues(entry);
            });
        },
        listFilters(params) {
            return withModel(async model => {
                const { sort, where } = params;
                const createdBy = security.getIdentity().id;

                const [entries, meta] = await cms.listLatestEntries(model, {
                    ...params,
                    sort: createListSort(sort),
                    where: {
                        ...({ ...where, createdBy } || {})
                    }
                });

                return [entries.map(getFilterFieldValues), meta];
            });
        },
        createFilter({ data }) {
            return withModel(async model => {
                const entry = await cms.createEntry(model, data);
                return getFilterFieldValues(entry);
            });
        },
        updateFilter({ id, data }) {
            return withModel(async model => {
                const original = await cms.getEntryById(model, id);

                const input = {
                    ...original,
                    ...data
                };

                const entry = await cms.updateEntry(model, original.id, input);
                return getFilterFieldValues(entry);
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
