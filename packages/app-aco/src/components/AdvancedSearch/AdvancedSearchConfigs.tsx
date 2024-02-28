import React from "react";
import { AcoConfig } from "~/config";
import { FieldType } from "~/components/AdvancedSearch/domain";
import {
    Boolean,
    DateWithoutTimezone,
    DateWithTimezone,
    Input,
    MultipleValues
} from "~/components/AdvancedSearch/fields";

const { AdvancedSearch } = AcoConfig;

export const AdvancedSearchConfigs = () => {
    return (
        <AcoConfig>
            <AdvancedSearch.FieldRenderer
                name={"text"}
                types={[FieldType.TEXT, FieldType.DATE, FieldType.TIME, FieldType.NUMBER]}
                element={<Input />}
            />
            <AdvancedSearch.FieldRenderer
                name={"boolean"}
                types={[FieldType.BOOLEAN]}
                element={<Boolean />}
            />
            <AdvancedSearch.FieldRenderer
                name={"dateTimeWithTimezone"}
                types={[FieldType.DATETIME_WITH_TIMEZONE]}
                element={<DateWithTimezone />}
            />
            <AdvancedSearch.FieldRenderer
                name={"dateTimeWithoutTimezone"}
                types={[FieldType.DATETIME_WITHOUT_TIMEZONE]}
                element={<DateWithoutTimezone />}
            />
            <AdvancedSearch.FieldRenderer
                name={"multipleValues"}
                types={[FieldType.MULTIPLE_VALUES]}
                element={<MultipleValues />}
            />
        </AcoConfig>
    );
};
