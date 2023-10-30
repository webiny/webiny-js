import React from "react";

import { Bind } from "@webiny/form";
import { Input as BaseInput } from "@webiny/ui/Input";

import { FieldType } from "~/components/AdvancedSearch/domain";

interface InputProps {
    type: FieldType;
    name: string;
}

export const Input = ({ type, name }: InputProps) => {
    return (
        <Bind name={name}>
            <BaseInput label={"Value"} type={type} />
        </Bind>
    );
};
