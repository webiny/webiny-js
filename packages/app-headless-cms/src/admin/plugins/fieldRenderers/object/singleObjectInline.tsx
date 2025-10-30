import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { Fields } from "~/admin/components/ContentEntryForm/Fields.js";
import { FieldSettings } from "./FieldSettings.js";
import { ParentFieldProvider } from "~/admin/components/ContentEntryForm/ParentValue.js";
import { ParentValueIndexProvider } from "~/admin/components/ModelFieldProvider/index.js";
import { fieldsGridStyle } from "./StyledComponents.js";
import { FormComponentDescription, Heading } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-object",
    renderer: {
        rendererName: "object",
        name: t`Inline Form`,
        description: t`Renders a set of fields.`,
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

            return (
                <Bind>
                    {bindProps => (
                        <Bind.ValidationContainer>
                            <ParentFieldProvider value={bindProps.value} path={Bind.parentName}>
                                <ParentValueIndexProvider index={-1}>
                                    <Heading
                                        level={5}
                                        className={
                                            "webiny_group-label-text mt-xl mb-sm relative text-accent-primary after:absolute after:z-0 after:inset-x-0 after:top-1/2 after:-translate-y-1/2 after:block after:content-[''] after:h-px after:border-primary-300 after:border-b-1 after:flex-1 after:min-w-0"
                                        }
                                    >
                                        <span className="relative z-1 pr-md bg-white">
                                            {field.label}
                                        </span>
                                    </Heading>
                                    {field.helpText && (
                                        <FormComponentDescription>
                                            {field.helpText}
                                        </FormComponentDescription>
                                    )}
                                    <div className={"py-md-extra"}>
                                        <Fields
                                            gridClassName={fieldsGridStyle}
                                            Bind={Bind}
                                            contentModel={contentModel}
                                            fields={settings.fields}
                                            layout={settings.layout}
                                        />
                                    </div>
                                </ParentValueIndexProvider>
                            </ParentFieldProvider>
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
