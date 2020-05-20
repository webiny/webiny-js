import * as React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import I18NRichTextEditor from "@webiny/app-i18n/admin/components/I18NRichTextEditor";
import { CmsEditorField } from "@webiny/app-headless-cms/types";
import { BindComponentRenderProp } from "@webiny/form";
import numberedListPlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/numberedList";
import bulletedListPlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/bulletedList";
import headingPlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/heading";
import codePlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/code";

type Props = {
    bind: BindComponentRenderProp;
    field: CmsEditorField;
};

const richTextPlugins = [
    numberedListPlugins.plugin,
    bulletedListPlugins.plugin,
    headingPlugins.plugin,
    codePlugins.plugin
];

const RichTextInput = (props: Props) => {
    return (
        <I18NRichTextEditor
            {...props.bind}
            onChange={props.bind.onChange}
            label={I18NValue({ value: props.field.label })}
            placeholder={I18NValue({ value: props.field.placeholderText })}
            description={I18NValue({ value: props.field.helpText })}
            plugins={richTextPlugins}
        />
    );
};

export default RichTextInput;
