import * as React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";
import { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput } from "@webiny/ui/Input";

type Props = {
    type?: string;
    bind: BindComponentRenderProp;
    field: CmsContentModelModelField;
};

const Input = (props: Props) => {
    return (
        <UiInput
            {...props.bind}
            label={I18NValue({ value: props.field.label })}
            placeholder={I18NValue({ value: props.field.placeholderText })}
            description={I18NValue({ value: props.field.helpText })}
            type={props.type}
        />
    );
};

export default Input;
