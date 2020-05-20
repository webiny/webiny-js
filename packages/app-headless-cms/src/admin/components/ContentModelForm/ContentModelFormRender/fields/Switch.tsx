import * as React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { CmsEditorField } from "@webiny/app-headless-cms/types";
import { BindComponentRenderProp } from "@webiny/form";
import { Switch as UiSwitch } from "@webiny/ui/Switch";

type Props = {
    type?: string;
    bind: BindComponentRenderProp;
    field: CmsEditorField;
};

const Input = (props: Props) => {
    return (
        <UiSwitch
            {...props.bind}
            label={I18NValue({ value: props.field.label })}
            description={I18NValue({ value: props.field.helpText })}
        />
    );
};

export default Input;
