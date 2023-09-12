import React from "react";

import { Boolean, DateWithTimezone, DateWithoutTimezone, Input, MultipleValues } from "./fields";

import { Field } from "~/components/AdvancedSearch/types";

interface InputFieldProps {
    field?: Field;
    name: string;
}

export const InputField: React.VFC<InputFieldProps> = ({ field, name }) => {
    if (!field) {
        return null;
    }

    if (field.type === "boolean") {
        return <Boolean name={name} />;
    }

    if (field.settings?.type === "dateTimeWithTimezone") {
        return <DateWithTimezone name={name} />;
    }

    if (field.settings?.type === "dateTimeWithoutTimezone") {
        return <DateWithoutTimezone name={name} />;
    }

    if (field?.multipleValues && field.predefinedValues?.enabled) {
        return <MultipleValues field={field} name={name} />;
    }

    return <Input name={name} field={field} />;
};
