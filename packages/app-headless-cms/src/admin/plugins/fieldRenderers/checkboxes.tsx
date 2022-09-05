import React from "react";
import get from "lodash/get";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-checkboxes-buttons",
    renderer: {
        rendererName: "checkboxes",
        name: t`Checkboxes`,
        description: t`Renders checkboxes, allowing selection of multiple values.`,
        canUse({ field }) {
            return !!field.multipleValues && !!get(field, "predefinedValues.enabled");
        },
        render({ field, getBind }) {
            const Bind = getBind();

            const { values: options = [] } = field.predefinedValues || {
                values: []
            };

            return (
                <Bind>
                    {bind => {
                        return (
                            <CheckboxGroup
                                {...bind}
                                label={field.label}
                                description={field.helpText}
                            >
                                {({ onChange, getValue }) => (
                                    <React.Fragment>
                                        {options.map((option, index) => {
                                            const value =
                                                field.type === "number"
                                                    ? Number(option.value)
                                                    : option.value;
                                            return (
                                                <div key={String(option.value) + index}>
                                                    <Checkbox
                                                        label={option.label}
                                                        value={getValue(value)}
                                                        onChange={onChange(value)}
                                                        data-testid={`fr.input.${field.label}`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                )}
                            </CheckboxGroup>
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
