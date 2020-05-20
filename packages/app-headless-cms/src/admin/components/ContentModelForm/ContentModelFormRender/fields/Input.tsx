import * as React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { CmsEditorField } from "@webiny/app-headless-cms/types";
import { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput } from "@webiny/ui/Input";

type Props = {
    type?: string;
    bind: BindComponentRenderProp;
    field: CmsEditorField;
};

const Input = (props: Props) => {
    return (
        <UiInput
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
        />
    );
};

export default Input;
