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
            <AdvancedSearch.FieldRenderer name={"text"} type={FieldType.TEXT} element={<Input />} />
            <AdvancedSearch.FieldRenderer name={"date"} type={FieldType.DATE} element={<Input />} />
            <AdvancedSearch.FieldRenderer name={"time"} type={FieldType.TIME} element={<Input />} />
            <AdvancedSearch.FieldRenderer
                name={"number"}
                type={FieldType.NUMBER}
                element={<Input />}
            />
            <AdvancedSearch.FieldRenderer
                name={"boolean"}
                type={FieldType.BOOLEAN}
                element={<Boolean />}
            />
            <AdvancedSearch.FieldRenderer
                name={"dateTimeWithTimezone"}
                type={FieldType.DATETIME_WITH_TIMEZONE}
                element={<DateWithTimezone />}
            />
            <AdvancedSearch.FieldRenderer
                name={"dateTimeWithoutTimezone"}
                type={FieldType.DATETIME_WITHOUT_TIMEZONE}
                element={<DateWithoutTimezone />}
            />
            <AdvancedSearch.FieldRenderer
                name={"multipleValues"}
                type={FieldType.MULTIPLE_VALUES}
                element={<MultipleValues />}
            />
        </AcoConfig>
    );
};
