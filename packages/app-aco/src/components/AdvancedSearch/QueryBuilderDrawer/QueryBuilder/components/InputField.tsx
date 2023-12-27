import React from "react";

import {
    Boolean,
    DateWithoutTimezone,
    DateWithTimezone,
    Input,
    MultipleValues,
    Ref
} from "./fields";

import { FieldDTO, FieldType } from "~/components/AdvancedSearch/domain";

interface InputFieldProps {
    field?: FieldDTO;
    name: string;
}

export const InputField = ({ field, name }: InputFieldProps) => {
    if (!field) {
        return null;
    }

    switch (field.type) {
        case FieldType.BOOLEAN:
            return <Boolean name={name} />;
        case FieldType.DATETIME_WITH_TIMEZONE:
            return <DateWithTimezone name={name} />;
        case FieldType.DATETIME_WITHOUT_TIMEZONE:
            return <DateWithoutTimezone name={name} />;
        case FieldType.MULTIPLE_VALUES:
            return <MultipleValues predefined={field.predefined} name={name} />;
        case FieldType.REF:
            return <Ref name={name} modelId={field.value.split("#")[0]} />;
        default:
            return <Input name={name} type={field.type} />;
    }
};
