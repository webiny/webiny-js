import * as React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import I18NRichTextEditor from "@webiny/app-i18n/admin/components/I18NRichTextEditor";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";
import { BindComponentRenderProp } from "@webiny/form";

type Props = {
    bind: BindComponentRenderProp;
    field: CmsContentModelModelField;
};

const RichTextInput = (props: Props) => {
    return (
        <I18NRichTextEditor
            {...props.bind}
            onChange={props.bind.onChange}
            label={I18NValue({ value: props.field.label })}
            placeholder={I18NValue({ value: props.field.placeholderText })}
            description={I18NValue({ value: props.field.helpText })}
        />
    );
};

export default RichTextInput;
