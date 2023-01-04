import React from "react";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/outlined/file_present.svg";
import { CmsEditorFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { Bind } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-file",
    field: {
        type: "file",
        label: t`Files`,
        description: t`Images, videos and other files.`,
        icon: <FileIcon />,
        validators: ["required"],
        listValidators: ["minLength", "maxLength"],
        allowMultipleValues: true,
        allowPredefinedValues: false,
        multipleValuesLabel: t`Use as a list of files or an image gallery`,
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings: () => {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"settings.imagesOnly"}>
                            <Switch
                                label={t`Images only`}
                                description={t`Allow only images to be selected`}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
