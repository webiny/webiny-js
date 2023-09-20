import React from "react";

import { Boolean, DateWithoutTimezone, DateWithTimezone, Input, MultipleValues } from "./fields";

import { FieldDTO, TypeDTO } from "~/components/AdvancedSearch/QueryBuilder/domain";

interface InputFieldProps {
    field?: FieldDTO;
    name: string;
}

export const InputField: React.VFC<InputFieldProps> = ({ field, name }) => {
    if (!field) {
        return null;
    }

    switch (field.type) {
        case TypeDTO.BOOLEAN:
            return <Boolean name={name} />;
        case TypeDTO.DATETIME_WITH_TIMEZONE:
            return <DateWithTimezone name={name} />;
        case TypeDTO.DATETIME_WITHOUT_TIMEZONE:
            return <DateWithoutTimezone name={name} />;
        case TypeDTO.MULTIPLE_VALUES:
            return <MultipleValues predefined={field.predefined} name={name} />;
        default:
            return <Input name={name} type={field.type} />;
    }
};
