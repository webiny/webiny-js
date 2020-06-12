import * as React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
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

const Input = (props: Props) => {
    return (
        <UiInput
            {...props}
            {...props.bind}
            onChange={value => {
                if (props.type === "number") {
                    value = parseFloat(value);
                }
                return props.bind.onChange(value);
            }}
            label={I18NValue({ value: props.field.label })}
            placeholder={I18NValue({ value: props.field.placeholderText })}
            description={I18NValue({ value: props.field.helpText })}
            type={props.type}
            trailingIcon={props.trailingIcon}
        />
    );
};

export default Input;
