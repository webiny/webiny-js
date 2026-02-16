import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { useForm } from "@webiny/form";
import type { CmsModelField, CmsModelFieldRendererPlugin } from "~/types.js";
import ContentEntriesMultiAutocomplete from "./components/ContentEntriesMultiAutoComplete.js";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const getKey = (field: CmsModelField, id: string | undefined): string => {
    return (id || "unknown") + "." + field.fieldId;
};

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref-inputs",
    renderer: {
        rendererName: "ref-inputs",
        name: t`Reference Inputs`,
        description: t`Renders an auto-complete input, allowing selection of multiple values.`,
        canUse({ field }) {
            return field.type === "ref" && !!field.list;
        },
        render(props) {
            const Bind = props.getBind();
            const form = useForm();

            return (
                <Bind>
                    {bind => (
                        <Bind.ValidationContainer>
                            <ContentEntriesMultiAutocomplete
                                key={getKey(props.field, form.data.id)}
                                {...props}
                                bind={bind}
                            />
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
