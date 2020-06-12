import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/close.svg";
import DynamicListMultipleValues from "./../DynamicListMultipleValues";
import get from "lodash/get";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-long-text-inputs",
    renderer: {
        rendererName: "long-text-inputs",
        name: t`Text Areas`,
        description: t`Renders a simple list of text areas.`,
        canUse({ field }) {
            return (
                field.type === "long-text" &&
                field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            return (
                <DynamicListMultipleValues {...props}>
                    {({ bind, index }) => (
                        <Input
                            {...bind.index}
                            autoFocus
                            rows={5}
                            label={t`Value {number}`({ number: index + 1 })}
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
