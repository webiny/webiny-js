import React from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";
import { AdvancedSearch } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";
import { CmsModelField } from "@webiny/app-headless-cms-common/types";

import { Field } from "@webiny/app-aco/types";

const excludedFieldTypes = ["rich-text", "file", "object", "dynamicZone"];

const parseModelFields = (modelFields: CmsModelField[]): Field[] => {
    return modelFields
        .filter(modelField => !excludedFieldTypes.includes(modelField.type))
        .map(modelField => {
            return {
                id: modelField.fieldId,
                type: modelField.type,
                label: modelField.label,
                multipleValues: modelField.multipleValues || false,
                predefinedValues: modelField?.predefinedValues || undefined,
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
