import React from "react";
import get from "lodash/get.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { DelayedOnChange, Textarea } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-long-text-textarea",
    renderer: {
        rendererName: "long-text-text-area",
        name: t`Text Area`,
        description: t`Renders a simple text area, suitable for larger amounts of text.`,
        canUse({ field }) {
            return (
                field.type === "long-text" && !field.list && !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => (
                        <Bind.ValidationContainer>
                            <DelayedOnChange
                                value={bind.value}
                                onChange={bind.onChange}
                                onBlur={bind.validate}
                            >
                                <Textarea
                                    rows={5}
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    description={field.description}
                                    note={field.note}
                                    hint={field.help}
                                    data-testid={`fr.input.longtext.${field.label}`}
                                    validation={bind.validation}
                                />
                            </DelayedOnChange>
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
