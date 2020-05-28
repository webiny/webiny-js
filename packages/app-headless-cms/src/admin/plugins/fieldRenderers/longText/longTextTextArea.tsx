import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Input } from "@webiny/ui/Input";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/close.svg";
import { i18n } from "@webiny/app/i18n";
import DynamicListMultipleValues from "./../DynamicListMultipleValues";
const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-long-text-textarea",
    renderer: {
        rendererName: "long-text-text-area",
        name: t`Text Area`,
        description: t`Renders a simple text area, suitable for larger amounts of text.`,
        canUse({ field }) {
            return field.type === "long-text" && !field.multipleValues && !field.predefinedValues;
        },
        render(props) {
            return (
                <DynamicListMultipleValues {...props}>
                    {({ bind, index }) => (
                        <Input
                            {...bind.index}
                            autoFocus
                            rows={5}
                            onEnter={() => bind.field.appendValue("")}
                            label={t`Value {number}`({ number: index + 1 })}
                            type="number"
                            trailingIcon={
                                index > 0 && {
                                    icon: <DeleteIcon />,
                                    onClick: bind.index.removeValue
                                }
                            }
                        />
                    )}
                </DynamicListMultipleValues>
            );
        }
    }
};

export default plugin;
