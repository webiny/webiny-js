import React from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";
import { AdvancedSearch } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";
import { CmsModelField } from "@webiny/app-headless-cms-common/types";

interface Fields {
    id: string;
    type: string;
    label: string;
    settings: any;
}

const parseModelFields = (modelFields: CmsModelField[]): Fields[] => {
    return modelFields.map(modelField => {
        return {
            id: modelField.fieldId,
            type: modelField.type,
            label: modelField.label,
            settings: modelField.settings
        };
    });
};

export const Filters = () => {
    const { browser } = useContentEntryListConfig();
    const list = useContentEntriesList();
    const { model } = useModel();

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

    return (
        <>
            <BaseFilters
                filters={browser.filters}
                show={list.showingFilters}
                data={{}}
                onChange={applyFilters}
            />
            <AdvancedSearch fields={parseModelFields(model.fields)} />
        </>
    );
};
