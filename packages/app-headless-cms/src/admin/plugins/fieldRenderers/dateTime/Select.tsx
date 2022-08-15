import * as React from "react";
import { Select as UiSelect, SelectProps as BaseSelectProps } from "@webiny/ui/Select";

export interface Option {
    value: string;
    label: string;
}

export interface SelectProps extends BaseSelectProps {
    options: Option[];
}
export const Select: React.FC<SelectProps> = props => {
    return (
        <UiSelect {...props}>
            {props.options.map(t => {
                return (
                    <option key={t.value} value={t.value} data-testid={`fr.input.${t.label}`}>
                        {t.label}
                    </option>
                );
            })}
        </UiSelect>
    );
};
