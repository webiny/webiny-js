import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Accordion } from "@webiny/admin-ui";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { Fields } from "~/admin/components/ContentEntryForm/Fields.js";
import { FieldSettings } from "./FieldSettings.js";
import { ParentFieldProvider } from "~/admin/hooks/index.js";
import { ParentValueIndexProvider } from "~/admin/components/ModelFieldProvider/index.js";
import {
    AccordionRenderSettings,
    getAccordionRenderSettings
} from "~/admin/plugins/fieldRenderers/AccordionRenderSettings.js";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
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

            const fieldSettings = FieldSettings.createFrom(field);

            if (!fieldSettings.hasFields()) {
                fieldSettings.logMissingFields();
                return null;
            }

            const settings = fieldSettings.getSettings();
            const { open } = getAccordionRenderSettings(field);

            return (
                <Bind>
                    {bindProps => (
                        <Bind.ValidationContainer>
                            <ParentFieldProvider value={bindProps.value} path={Bind.parentName}>
                                <ParentValueIndexProvider index={-1}>
                                    <Accordion>
                                        <Accordion.Item
                                            title={field.label}
                                            description={field.helpText}
                                            defaultOpen={open}
                                        >
                                            <Fields
                                                Bind={Bind}
                                                contentModel={contentModel}
                                                fields={settings.fields || []}
                                                layout={settings.layout || []}
                                            />
                                        </Accordion.Item>
                                    </Accordion>
                                </ParentValueIndexProvider>
                            </ParentFieldProvider>
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        },
        renderSettings({ field }) {
            return <AccordionRenderSettings field={field} />;
        }
    }
};

export default plugin;
