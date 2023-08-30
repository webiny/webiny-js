import React from "react";

import { Boolean, DateWithTimezone, DateWithoutTimezone, Input, MultipleValues } from "./fields";

import { Field } from "~/components/AdvancedSearch/types";

interface InputFieldProps {
    field?: Field;
}

export const InputField: React.VFC<InputFieldProps> = ({ field }) => {
    if (!field) {
        return null;
    }

    if (field.type === "boolean") {
        return <Boolean />;
    }

    if (field.settings?.type === "dateTimeWithTimezone") {
        return <DateWithTimezone />;
    }

    if (field.settings?.type === "dateTimeWithoutTimezone") {
        return <DateWithoutTimezone />;
    }

    if (field?.multipleValues && field.predefinedValues?.enabled) {
        return <MultipleValues field={field} />;
    }

    return <Input field={field} />;
};
