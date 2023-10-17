import React, { useEffect, useState } from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";
import { AdvancedSearch, GraphQLInputMapper } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";
import { FieldsMapper } from "./FieldsMapper";
import { FieldRaw, QueryObjectDTO } from "@webiny/app-aco/components/AdvancedSearch/domain";

export const Filters = () => {
    const { browser } = useContentEntryListConfig();
    const list = useContentEntriesList();
    const { model } = useModel();
    const [fields, setFields] = useState<FieldRaw[] | undefined>();

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

    const applyAdvancedSearch = (data: QueryObjectDTO | null) => {
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
        <BaseFilters
            filters={browser.filters}
            show={list.showingFilters}
            data={{}}
            onChange={applyFilters}
        >
            <AdvancedSearch
                fields={fields}
                modelId={model.modelId}
                onApplyFilter={applyAdvancedSearch}
            />
        </BaseFilters>
    );
};
