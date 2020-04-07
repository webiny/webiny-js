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
            label={I18NValue(props.field.label)}
            placeholder={I18NValue(props.field.placeholderText)}
            type={props.type}
            className="webiny-fb-form-field__input"
        />
    );
};

export default Input;
