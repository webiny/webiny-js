import React, { useEffect } from "react";
import { Input, TrailingIcon } from "./Input";
import { CmsEditorField } from "~/types";
import {
    getCurrentDate,
    getDefaultFieldValue
} from "~/admin/plugins/fieldRenderers/dateTime/utils";

export interface Props {
    field: CmsEditorField;
    bind: any;
    trailingIcon?: TrailingIcon;
}

export const DateOnly: React.FC<Props> = props => {
    const { field, bind, trailingIcon } = props;
    const date = getDefaultFieldValue(field, bind, () => {
        return getCurrentDate(new Date());
    });

    const bindValue = bind.value || "";

    useEffect(() => {
        if (!date || bindValue === date) {
            return;
        }
        bind.onChange(date);
    }, [bindValue]);

    return (
        <Input
            bind={{
                ...bind,
                value: date,
                onChange: (value: string) => {
                    if (!value) {
                        if (!bindValue) {
                            return;
                        }
                        return bind.onChange("");
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
