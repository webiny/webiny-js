import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";

import I18NRichTextEditor from "@webiny/app-i18n/admin/components/I18NRichTextEditor";
import numberedListPlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/numberedList";
import bulletedListPlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/bulletedList";
import headingPlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/heading";
import codePlugins from "@webiny/app-i18n/admin/plugins/richTextEditor/code";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const richTextPlugins = [
    numberedListPlugins.plugin,
    bulletedListPlugins.plugin,
    headingPlugins.plugin,
    codePlugins.plugin
];

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-rich-text",
    renderer: {
        rendererName: "rich-text-input",
        name: t`Rich Text Input`,
        description: t`Renders a rich text input.`,
        canUse({ field }) {
            return field.type === "rich-text" && !field.multipleValues && !field.predefinedValues;
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => (
                        <I18NRichTextEditor
                            {...bind}
                            onChange={bind.onChange}
                            label={I18NValue({ value: field.label })}
                            placeholder={I18NValue({ value: field.placeholderText })}
                            description={I18NValue({ value: field.helpText })}
                            plugins={richTextPlugins}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
