import React from "react";
import get from "lodash/get";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import DynamicSection from "../DynamicSection";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-number-inputs",
    renderer: {
        rendererName: "number-inputs",
        name: t`Number Inputs`,
        description: t`Renders a simple list of number inputs.`,
        canUse({ field }) {
            return (
                field.type === "number" &&
                !!field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            return (
                <DynamicSection {...props}>
                    {({ bind, index }) => (
                        <Input
                            {...bind.index}
                            onChange={value => {
                                return bind.index.onChange(value);
                            }}
                            onEnter={() => bind.field.appendValue("")}
                            label={t`Value {number}`({ number: index + 1 })}
                            type="number"
                            trailingIcon={
                                index > 0 && {
                                    icon: <DeleteIcon />,
                                    onClick: () => bind.field.removeValue(index)
                                }
                            }
                        />
                    )}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
