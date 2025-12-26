import React from "react";
import { AcoConfig } from "~/config/index.js";
import { FieldType } from "~/components/AdvancedSearch/domain/index.js";
import {
    Boolean,
    DateWithoutTimezone,
    DateWithTimezone,
    Input,
    PredefinedValues
} from "~/components/AdvancedSearch/fields/index.js";

const { AdvancedSearch } = AcoConfig;

export const AdvancedSearchConfigs = React.memo(() => {
    return (
        <>
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
                name={"predefinedValues"}
                type={FieldType.PREDEFINED_VALUES}
                element={<PredefinedValues />}
            />
        </>
    );
});

AdvancedSearchConfigs.displayName = "AdvancedSearchConfigs";
