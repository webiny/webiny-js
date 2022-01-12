import React, { useEffect, useState } from "react";
import { Input, TrailingIcon } from "./Input";
import { CmsEditorField } from "~/types";
import { getFieldValue } from "~/admin/plugins/fieldRenderers/dateTime/utils";

export interface Props {
    field: CmsEditorField;
    bind: any;
    trailingIcon?: TrailingIcon;
}

export const DateOnly: React.FC<Props> = props => {
    const { field, bind, trailingIcon } = props;
    const initialDate = getFieldValue(field, bind, () => {
        return new Date().toISOString().substr(0, 10);
    });

    const [date, setDate] = useState<string>("");

    useEffect(() => {
        if (!initialDate) {
            return;
        }
        setDate(initialDate);
        bind.onChange(initialDate);
    }, []);

    return (
        <Input
            bind={{
                ...bind,
                value: date,
                onChange: (value: string) => {
                    if (!value && initialDate) {
                        value = initialDate;
                    }
                    return bind.onChange(value);
                }
            }}
            field={field}
            type={field.settings.type}
            trailingIcon={trailingIcon}
        />
    );
};
