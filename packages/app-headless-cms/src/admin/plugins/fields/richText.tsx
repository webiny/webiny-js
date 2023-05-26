import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CmsModelFieldTypePlugin } from "~/types";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as NotesIcon } from "@material-design-icons/svg/outlined/text_snippet.svg";
import { Input } from "@webiny/ui/Input";
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
        allowMultipleValues: true,
        allowPredefinedValues: false,
        multipleValuesLabel: t`Use as a list of rich texts`,
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
