import React from "react";
import get from "lodash/get";
import { CmsModelFieldRendererPlugin } from "~/types";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import DynamicSection from "../DynamicSection";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-long-text-inputs",
    renderer: {
        rendererName: "long-text-inputs",
        name: t`Text Areas`,
        description: t`Renders a simple list of text areas.`,
        canUse({ field }) {
            return (
                field.type === "long-text" &&
                !!field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            return (
                <DynamicSection {...props}>
                    {({ bind, index }) => (
                        <DelayedOnChange
                            value={bind.index.value}
                            onChange={bind.index.onChange}
                            onBlur={bind.index.validate}
                        >
                            <Input
                                validation={bind.index.validation}
                                rows={5}
                                label={t`Value {number}`({ number: index + 1 })}
                                placeholder={props.field.placeholderText}
                                description={props.field.helpText}
                                data-testid={`fr.input.longTexts.${props.field.label}.${index + 1}`}
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
