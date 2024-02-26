import React from "react";
import { CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import ContentEntriesAutocomplete from "./components/ContentEntriesAutocomplete";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref",
    renderer: {
        rendererName: "ref-input",
        name: t`Reference Input`,
        description: t`Renders an auto-complete input, allowing selection of a single value.`,
        canUse({ field }) {
            return field.type === "ref" && !field.multipleValues;
        },
        render(props) {
            const Bind = props.getBind();

            return <Bind>{bind => <ContentEntriesAutocomplete {...props} bind={bind} />}</Bind>;
        }
    }
};

export default plugin;
