import React from "react";
import get from "lodash/get";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-rich-text",
    renderer: {
        rendererName: "rich-text-input",
        name: t`Rich Text Input`,
        description: t`Renders a rich text editor.`,
        canUse({ field }) {
            return (
                field.type === "rich-text" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => (
                        <RichTextEditor
                            {...bind}
                            onChange={bind.onChange}
                            label={field.label}
                            placeholder={field.placeholderText}
                            description={field.helpText}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
