import * as React from "react";
import { CmsModelField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput } from "@webiny/ui/Input";

export interface TrailingIcon {
    icon: React.ReactNode;
    onClick: any;
}

export interface InputProps {
    step?: number;
    type?: string;
    bind: BindComponentRenderProp;
    field: CmsModelField;
    trailingIcon?: TrailingIcon;
}

export const Input = ({ bind, ...props }: InputProps) => {
    return (
        <UiInput
            {...props}
            {...bind}
            onChange={value => {
                if (props.type === "number") {
                    value = parseFloat(value);
                }
                return bind.onChange(value);
            }}
            label={props.field.label}
            placeholder={props.field.placeholderText}
            description={props.field.helpText}
            type={props.type}
            trailingIcon={props.trailingIcon}
            data-testid={`fr.input.${props.field.label}`}
        />
    );
};
