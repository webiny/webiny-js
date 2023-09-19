import React from "react";

import { Boolean, DateWithoutTimezone, DateWithTimezone, Input, MultipleValues } from "./fields";

import { FieldDTO, TypeEnum } from "~/components/AdvancedSearch/QueryBuilder/domain";

interface InputFieldProps {
    field?: FieldDTO;
    name: string;
    value: any;
}

export const InputField: React.VFC<InputFieldProps> = ({ field, name }) => {
    if (!field) {
        return null;
    }

    switch (field.type.value) {
        case TypeEnum.BOOLEAN:
            return <Boolean name={name} />;
        case TypeEnum.DATETIME_WITH_TIMEZONE:
            return <DateWithTimezone name={name} />;
        case TypeEnum.DATETIME_WITHOUT_TIMEZONE:
            return <DateWithoutTimezone name={name} />;
        case TypeEnum.MULTIPLE_VALUES:
            return <MultipleValues predefined={field.predefined} name={name} />;
        default:
            return <Input name={name} type={field.type} />;
    }
};
