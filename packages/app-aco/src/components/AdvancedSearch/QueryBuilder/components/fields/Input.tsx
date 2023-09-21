import React from "react";

import { Bind } from "@webiny/form";
import { Input as BaseInput } from "@webiny/ui/Input";

import { TypeDTO } from "~/components/AdvancedSearch/QueryBuilder/domain";

interface InputProps {
    type: TypeDTO;
    name: string;
}

export const Input = ({ type, name }: InputProps) => {
    return (
        <Bind name={name}>
            <BaseInput label={"Value"} type={type} />
        </Bind>
    );
};
