import React from "react";
import { CmsModelField, CmsModelFieldRendererPlugin } from "~/types";
import ContentEntriesMultiAutocomplete from "./components/ContentEntriesMultiAutoComplete";

import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const getKey = (
    field: CmsModelField,
    data?: {
        id?: string;
    }
): string => {
    return (data?.id || "unknown") + "." + field.fieldId;
};

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref-inputs",
    renderer: {
        rendererName: "ref-inputs",
        name: t`Reference Inputs`,
        description: t`Renders an auto-complete input, allowing selection of multiple values.`,
        canUse({ field }) {
            return field.type === "ref" && !!field.multipleValues;
        },
        render(props) {
            const Bind = props.getBind();
            return (
                <Bind>
                    {bind => (
                        <ContentEntriesMultiAutocomplete
                            key={getKey(props.field, bind.form?.data)}
                            {...props}
                            bind={bind}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
