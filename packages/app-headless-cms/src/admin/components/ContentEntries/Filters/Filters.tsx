import React, { useCallback } from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";
import { AdvancedSearch, GraphQLInputMapper } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";
import {
    FieldRaw,
    QueryObjectDTO
} from "@webiny/app-aco/components/AdvancedSearch/QueryBuilder/domain";

export const Filters = () => {
    const { browser } = useContentEntryListConfig();
    const list = useContentEntriesList();
    const { model } = useModel();

    const getFields = useCallback((): FieldRaw[] => {
        const excludedFieldTypes = ["ref", "rich-text", "file", "object", "dynamicZone"];

        const defaultFields = [
            {
                id: "status",
                type: "text",
                label: "Status",
                multipleValues: true,
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "Draft",
                            value: "draft"
                        },
                        {
                            label: "Published",
                            value: "published"
                        },
                        {
                            label: "Unpublished",
                            value: "unpublished"
                        }
                    ]
                }
            },
            {
                id: "createdOn",
                type: "datetime",
                label: "Created on",
                settings: { type: "dateTimeWithoutTimezone" }
            },
            {
                id: "savedOn",
                type: "datetime",
                label: "Modified on",
                settings: { type: "dateTimeWithoutTimezone" }
            }
        ];

        const fields = model.fields
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

        return [...defaultFields, ...fields];
    }, [model.fields]);

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

    const applyAdvancedSearch = (data: QueryObjectDTO) => {
        if (!Object.keys(data).length) {
            return;
        }

        list.setFilters(GraphQLInputMapper.toGraphQL(data));
    };

    return (
        <BaseFilters
            filters={browser.filters}
            show={list.showingFilters}
            data={{}}
            onChange={applyFilters}
        >
            <AdvancedSearch fields={getFields()} onSubmit={applyAdvancedSearch} />
        </BaseFilters>
    );
};
