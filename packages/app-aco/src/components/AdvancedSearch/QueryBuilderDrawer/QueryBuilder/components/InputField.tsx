import React from "react";
import { ApolloClient } from "apollo-client";
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
    refClient: ApolloClient<any>;
}

export const InputField = ({ field, name, refClient }: InputFieldProps) => {
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
            return <Ref name={name} modelIds={field.settings.modelIds} client={refClient} />;
        default:
            return <Input name={name} type={field.type} />;
    }
};
