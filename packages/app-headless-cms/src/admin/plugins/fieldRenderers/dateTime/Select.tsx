import * as React from "react";
import { Select as UiSelect, SelectProps } from "@webiny/ui/Select";

export interface Option {
    value: string;
    label: string;
}

export interface Props extends SelectProps {
    options: Option[];
}
export const Select: React.FC<Props> = props => {
    return (
        <UiSelect {...props}>
            {props.options.map(t => {
                return (
                    <option key={t.value} value={t.value}>
                        {t.label}
                    </option>
                );
            })}
        </UiSelect>
    );
};
