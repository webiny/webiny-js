import * as React from "react";
import { CmsEditorField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput } from "@webiny/ui/Input";

export interface TrailingIcon {
    icon: React.ReactNode;
    onClick: any;
}

export interface Props {
    step?: number;
    type?: string;
    bind: BindComponentRenderProp;
    field: CmsEditorField;
    trailingIcon?: TrailingIcon;
}

export const Input: React.FC<Props> = ({ bind, ...props }) => {
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
        />
    );
};
