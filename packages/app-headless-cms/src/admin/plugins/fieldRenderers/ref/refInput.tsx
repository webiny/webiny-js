import React from "react";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import ContentEntriesAutocomplete from "./components/ContentEntriesAutocomplete";
import { NewRefEntryDialogContextProvider } from "./hooks/useNewRefEntryDialog";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref",
    renderer: {
        rendererName: "ref-input",
        name: t`Autocomplete Input`,
        description: t`Renders an auto-complete input, allowing selection of a single value.`,
        canUse({ field }) {
            return field.type === "ref" && !field.multipleValues;
        },
        render(props) {
            const Bind = props.getBind();
            return (
                <Bind>
                    {bind => (
                        <NewRefEntryDialogContextProvider>
                            <ContentEntriesAutocomplete {...props} bind={bind} />
                        </NewRefEntryDialogContextProvider>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
