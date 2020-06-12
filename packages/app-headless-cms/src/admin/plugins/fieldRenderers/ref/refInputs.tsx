import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import ContentEntriesMultiAutocomplete from "./components/ContentEntriesMultiAutoComplete";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref-inputs",
    renderer: {
        rendererName: "ref-inputs",
        name: t`Reference Inputs`,
        description: t`Renders an auto-complete input, allowing selection of multiple values.`,
        canUse({ field }) {
            return field.type === "ref" && field.multipleValues;
        },
        render(props) {
            const Bind = props.getBind();
            return (
                <Bind>{bind => <ContentEntriesMultiAutocomplete {...props} bind={bind} />}</Bind>
            );
        }
    }
};

export default plugin;
