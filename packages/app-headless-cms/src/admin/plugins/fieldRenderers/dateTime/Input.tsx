import * as React from "react";
import { CmsEditorField } from "@webiny/app-headless-cms/types";
import { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput } from "@webiny/ui/Input";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

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
    locale?: string;
};

const Input = (props: Props) => {
    const { getValue } = useI18N();

    const label = getValue(props.field.label, props.locale);
    const placeholderText = getValue(props.field.placeholderText, props.locale);
    const helpText = getValue(props.field.helpText, props.locale);

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
            label={label}
            placeholder={placeholderText}
            description={helpText}
            type={props.type}
            trailingIcon={props.trailingIcon}
        />
    );
};

export default Input;
