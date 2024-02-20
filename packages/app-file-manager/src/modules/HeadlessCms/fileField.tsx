import React from "react";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/outlined/file_present.svg";
import { CmsModelFieldTypePlugin } from "@webiny/app-headless-cms/types";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { Bind } from "@webiny/form";

export const fileField: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-file",
    field: {
        type: "file",
        label: "Files",
        description: "Images, videos and other files.",
        icon: <FileIcon />,
        validators: ["required"],
        listValidators: ["minLength", "maxLength"],
        allowMultipleValues: true,
        allowPredefinedValues: false,
        multipleValuesLabel: "Use as a list of files or an image gallery",
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
                                label={"Images only"}
                                description={"Allow only images to be selected"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
