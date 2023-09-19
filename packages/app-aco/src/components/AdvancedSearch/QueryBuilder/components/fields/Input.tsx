import React from "react";

import { Bind } from "@webiny/form";
import { Input as BaseInput } from "@webiny/ui/Input";

import { Type } from "~/components/AdvancedSearch/QueryBuilder/domain";

interface InputProps {
    type: Type;
    name: string;
}

export const Input = ({ type, name }: InputProps) => {
    return (
        <Bind name={name}>
            <BaseInput label={"Value"} type={type.value} />
        </Bind>
    );
};
