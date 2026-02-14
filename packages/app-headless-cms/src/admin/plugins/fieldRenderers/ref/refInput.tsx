import React from "react";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import ContentEntriesAutocomplete from "./components/ContentEntriesAutocomplete.js";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref",
    renderer: {
        rendererName: "ref-input",
        name: t`Reference Input`,
        description: t`Renders an auto-complete input, allowing selection of a single value.`,
        canUse({ field }) {
            return field.type === "ref" && !field.list;
        },
        render(props) {
            const Bind = props.getBind();

            return (
                <Bind>
                    {bind => (
                        <Bind.ValidationContainer>
                            <ContentEntriesAutocomplete {...props} bind={bind} />
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
