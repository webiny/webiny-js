import { CmsEditorFieldValidatorFileTypePlugin } from "~/admin/plugins/definitions/CmsEditorFieldValidatorFileTypePlugin";

export const imageFileType = new CmsEditorFieldValidatorFileTypePlugin({
    name: "images",
    label: "Images",
    message: "Only images allowed."
});
