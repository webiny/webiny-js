import * as React from "react";
import type { SelectProps as UiSelectProps } from "@webiny/admin-ui";
import { Select as UiSelect } from "@webiny/admin-ui";
import { useEffectiveRules, useModelField } from "@webiny/app-headless-cms-common";

export interface Option {
    value: string;
    label: string;
}

export interface SelectProps extends UiSelectProps {
    options: Option[];
}
export const Select = (props: SelectProps) => {
    const { field } = useModelField();
    const rules = useEffectiveRules(field);

    const disabled = !rules.canEdit || rules.disabled;

    return (
        <UiSelect
            {...props}
            disabled={disabled}
            options={props.options.map(option => ({
                value: option.value,
                label: option.label,
                "data-testid": `fr.input.${option.label}`
            }))}
        />
    );
};
