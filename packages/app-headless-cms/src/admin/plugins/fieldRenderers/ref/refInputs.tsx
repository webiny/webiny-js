import React from "react";
import { CmsEditorField, CmsEditorFieldRendererPlugin } from "~/types";
import ContentEntriesMultiAutocomplete from "./components/ContentEntriesMultiAutoComplete";
import { NewRefEntryDialogContextProvider } from "./hooks/useNewRefEntryDialog";

import { i18n } from "@webiny/app/i18n";
import { BindComponentRenderProp } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const getKey = (field: CmsEditorField, bind: BindComponentRenderProp): string => {
    return bind.form.data.id + "." + field.fieldId;
};

const plugin: CmsEditorFieldRendererPlugin = {
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
                        <NewRefEntryDialogContextProvider>
                            <ContentEntriesMultiAutocomplete
                                key={getKey(props.field, bind)}
                                {...props}
                                bind={bind}
                            />
                        </NewRefEntryDialogContextProvider>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
