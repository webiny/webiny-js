import React from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { Input } from "@webiny/ui/Input";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { CmsModelFieldRendererPlugin } from "~/types";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import DynamicSection from "../DynamicSection";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-text-inputs",
    renderer: {
        rendererName: "text-inputs",
        name: t`Text Inputs`,
        description: t`Renders a simple list of text inputs.`,
        canUse({ field }) {
            return (
                field.type === "text" &&
                !!field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            return (
                <DynamicSection {...props}>
                    {({ bind, index }) => (
                        <DelayedOnChange {...bind.index}>
                            <Input
                                onEnter={() => bind.field.appendValue("")}
                                label={t`Value {number}`({ number: index + 1 })}
                                placeholder={props.field.placeholderText}
                                description={props.field.helpText}
                                data-testid={`fr.input.texts.${props.field.label}.${index + 1}`}
                                trailingIcon={
                                    index > 0 && {
                                        icon: <DeleteIcon />,
                                        onClick: () => bind.field.removeValue(index)
                                    }
                                }
                            />
                        </DelayedOnChange>
                    )}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
