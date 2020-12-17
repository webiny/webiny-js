import * as React from "react";
import { CmsEditorField } from "@webiny/app-headless-cms/types";
import { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput } from "@webiny/ui/Input";

type TrailingIconType = {
    icon: React.ReactNode;
    onClick: any;
};

type Props = {
    step?: number;
    type?: string;
    bind: BindComponentRenderProp;
    field: CmsEditorField;
    trailingIcon?: TrailingIconType;
};

const Input = ({ bind, ...props}: Props) => {
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

export default Input;
