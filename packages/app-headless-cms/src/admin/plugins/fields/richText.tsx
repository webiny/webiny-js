import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelFieldTypePlugin } from "~/types.js";
import { ReactComponent as NotesIcon } from "@webiny/icons/text_snippet.svg";
import { Grid, Input } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-richText",
    field: {
        type: "rich-text",
        label: t`Rich text`,
        description: t`Text formatting with references and media.`,
        icon: <NotesIcon />,
        allowList: true,
        allowPredefinedValues: false,
        listLabel: t`Use as a list of rich texts`,
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
                    <Grid.Column span={12}>
                        <Bind name={"placeholder"}>
                            <Input
                                label={t`Placeholder text`}
                                size={"lg"}
                                description={
                                    "This text will be shown in an empty input component (optional)"
                                }
                            />
                        </Bind>
                    </Grid.Column>
                </Grid>
            );
        }
    }
};

export default plugin;
