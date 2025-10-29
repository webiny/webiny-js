import React from "react";
import get from "lodash/get.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import DynamicSection from "../DynamicSection.js";
import { MultiValueRendererSettings } from "~/admin/plugins/fieldRenderers/MultiValueRendererSettings.js";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
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
                        <DelayedOnChange
                            value={bind.index.value}
                            onChange={bind.index.onChange}
                            onBlur={bind.index.validate}
                        >
                            <Input
                                validation={bind.index.validation}
                                onEnter={() => bind.field.appendValue("")}
                                label={t`Value {number}`({ number: index + 1 })}
                                placeholder={props.field.placeholderText}
                                data-testid={`fr.input.numbers.${props.field.label}.${index + 1}`}
                                type="number"
                                endIcon={
                                    <Icon
                                        icon={<DeleteIcon />}
                                        label={"Delete"}
                                        onClick={() => bind.field.removeValue(index)}
                                        className={"cursor-pointer"}
                                    />
                                }
                            />
                        </DelayedOnChange>
                    )}
                </DynamicSection>
            );
        },
        renderSettings(props) {
            return <MultiValueRendererSettings {...props} />;
        }
    }
};

export default plugin;
