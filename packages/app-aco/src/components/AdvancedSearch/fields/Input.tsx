import React, { useMemo } from "react";

import { Bind } from "@webiny/form";
import { Input as BaseInput } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";

import { Field } from "~/components/AdvancedSearch/types";

interface InputProps {
    field: Field;
}

export const Input: React.VFC<InputProps> = ({ field }) => {
    const type = useMemo(() => {
        if (field.type === "datetime") {
            return field.settings?.type;
        }

        return field.type || "text";
    }, [field]);

    return (
        <Bind name={"value"} validators={[validation.create("required")]}>
            <BaseInput label={"Value"} type={type} />
        </Bind>
    );
};
