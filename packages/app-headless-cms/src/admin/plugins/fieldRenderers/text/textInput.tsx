import React from "react";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange/index.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { Input } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-text",
    renderer: {
        rendererName: "text-input",
        name: t`Text Input`,
        description: t`Renders a simple input with its type set to "text".`,
        canUse({ field }) {
            return field.type === "text" && !field.list && !get(field, "predefinedValues.enabled");
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
                                <Input
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    description={field.description}
                                    hint={field.help}
                                    note={field.note}
                                    data-testid={`fr.input.text.${field.label}`}
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
