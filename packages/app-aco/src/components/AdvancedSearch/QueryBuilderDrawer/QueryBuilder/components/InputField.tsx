import React from "react";

import { Typography } from "@webiny/ui/Typography";
import { InputFieldProvider } from "~/components";
import { FieldDTO, FieldDTOWithElement } from "~/components/AdvancedSearch/domain";

interface InputFieldProps {
    field?: FieldDTOWithElement;
    name: string;
}

export interface InputFieldContext {
    field: FieldDTO;
    name: string;
}

export const InputField = ({ field, name }: InputFieldProps) => {
    if (!field) {
        return null;
    }

    const { element, ...rest } = field;

    if (!element) {
        return (
            <Typography
                use={"body2"}
            >{`Cannot render "${field.type}" field: missing field renderer.`}</Typography>
        );
    }

    return (
        <InputFieldProvider field={rest} name={name}>
            {element}
        </InputFieldProvider>
    );
};
