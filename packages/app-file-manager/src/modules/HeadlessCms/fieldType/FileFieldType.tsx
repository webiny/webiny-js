import React from "react";
import { ReactComponent as FileIcon } from "@webiny/icons/file_present.svg";
import { CmsFieldType } from "@webiny/app-headless-cms/presentation/fieldTypes/abstractions.js";

class FileFieldTypeImpl implements CmsFieldType.Interface {
    type = "file";
    label = "Files";
    description = "Images, videos and other files.";
    icon = (<FileIcon />);
    allowList = true;
    listLabel = "Use as a list of files or an image gallery";
    allowPredefinedValues = false;
    validators = ["required"];
    listValidators = ["minLength", "maxLength"];

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" }
        };
    }
}

export const FileFieldType = CmsFieldType.createImplementation({
    implementation: FileFieldTypeImpl,
    dependencies: []
});
