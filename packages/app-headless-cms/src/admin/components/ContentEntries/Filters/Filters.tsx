import React, { useEffect, useState } from "react";
import type { FiltersOnSubmit } from "@webiny/app-admin";
import { Filters as BaseFilters } from "@webiny/app-admin";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks/index.js";
import { AdvancedSearch, GraphQLInputMapper, useFilterRepository } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks/index.js";
import { FieldsMapper } from "./FieldsMapper.js";
import type {
    FieldRaw,
    FilterDTO
} from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";

export const Filters = () => {
    const { browser } = useContentEntryListConfig();
    const list = useContentEntriesList();
    const { model } = useModel();
    const [fields, setFields] = useState<FieldRaw[] | undefined>();
    const repository = useFilterRepository(`cms:${model.modelId}`);

    useEffect(() => {
        setFields(FieldsMapper.toRaw(model));
    }, [model]);

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (data, converter) => converter(data),
            data
        );

        list.setFilters(convertedFilters);
    };

    const applyAdvancedSearch = (data: FilterDTO | null) => {
        if (!data) {
            return list.setFilters({});
        }

        if (!Object.keys(data).length) {
            return;
        }

        list.setFilters(GraphQLInputMapper.toGraphQL(data));
    };

    if (!fields) {
        return null;
    }

    return (
        <BaseFilters filters={browser.filters} show={list.showingFilters} onChange={applyFilters}>
            <AdvancedSearch
                fields={fields}
                fieldRenderers={browser.advancedSearch.fieldRenderers}
                repository={repository}
                onApplyFilter={applyAdvancedSearch}
            />
        </BaseFilters>
    );
};
