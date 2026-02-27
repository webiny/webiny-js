import React from "react";
import get from "lodash/get.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import DynamicSection from "../DynamicSection.js";
import { MultiValueRendererSettings } from "~/admin/plugins/fieldRenderers/MultiValueRendererSettings.js";
import { DelayedOnChange, IconButton, Textarea } from "@webiny/admin-ui";
import { CanEditField, useModelField } from "@webiny/app-headless-cms-common";

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
                !!field.list &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            const { permissions } = useModelField();

            return (
                <DynamicSection {...props} disabled={!permissions.canEdit}>
                    {({ bind, index }) => (
                        <div className={"relative"}>
                            <DelayedOnChange
                                value={bind.index.value}
                                onChange={bind.index.onChange}
                                onBlur={bind.index.validate}
                            >
                                <Textarea
                                    disabled={!permissions.canEdit}
                                    validation={bind.index.validation}
                                    rows={5}
                                    label={t`Value {number}`({ number: index + 1 })}
                                    placeholder={props.field.placeholder}
                                    data-testid={`fr.input.longTexts.${props.field.label}.${
                                        index + 1
                                    }`}
                                />
                            </DelayedOnChange>
                            <CanEditField>
                                <div className={"absolute top-xl right-sm z-10"}>
                                    <IconButton
                                        variant={"ghost"}
                                        size={"md"}
                                        icon={<DeleteIcon />}
                                        onClick={() => bind.field.removeValue(index)}
                                    />
                                </div>
                            </CanEditField>
                        </div>
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
