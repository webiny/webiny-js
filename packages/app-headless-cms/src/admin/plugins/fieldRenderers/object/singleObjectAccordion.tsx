import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-object-accordion",
    renderer: {
        rendererName: "object-accordion",
        name: t`Accordion`,
        description: t`Renders fields within an accordion.`,
        canUse({ field }) {
            return field.type === "object" && !field.multipleValues;
        },
        render({ field, getBind, contentModel }) {
            const Bind = getBind();

            const settings = field.settings || {};

            return (
                <Accordion>
                    <AccordionItem title={field.label} description={field.helpText}>
                        <Fields
                            Bind={Bind}
                            contentModel={contentModel}
                            fields={settings.fields || []}
                            layout={settings.layout || []}
                        />
                    </AccordionItem>
                </Accordion>
            );
        }
    }
};

export default plugin;
