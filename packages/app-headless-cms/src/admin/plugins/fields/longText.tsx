import React from "react";
import { ReactComponent as LongTextIcon } from "./icons/round-notes.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CmsModelFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Bind } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-long-text",
    field: {
        type: "long-text",
        validators: ["required", "minLength", "maxLength", "pattern"],
        label: t`Long text`,
        description: t`Long comments, notes, multi line values.`,
        icon: <LongTextIcon />,
        allowMultipleValues: true,
        allowPredefinedValues: false, // TODO: implement "renderPredefinedValues" and set to true.
        multipleValuesLabel: t`Use as a list of long texts`,
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings() {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"placeholderText"}>
                            <Input
                                label={t`Placeholder text`}
                                description={t`Placeholder text (optional)`}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
