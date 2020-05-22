import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import SingleFile from "./SingleFile";
import MultipleFile from "./MultipleFile";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/date-time");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-file",
    renderer: {
        rendererName: "file-input",
        name: t`File Input`,
        description: t`Renders inputs for file.`,
        canUse({ field }) {
            return field.type === "file" && field.multipleValues && !field.predefinedValues;
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => {
                        if (field.settings.type === "single") {
                            return <SingleFile field={field} bind={bind} />;
                        }
                        if (field.settings.type === "multiple") {
                            return <MultipleFile field={field} bind={bind} />;
                        }

                        return <span >Not a valid file type {field.settings.type}</span>;
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
