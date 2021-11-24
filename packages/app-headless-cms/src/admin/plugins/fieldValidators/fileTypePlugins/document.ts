import { CmsEditorFieldValidatorFileTypePlugin } from "~/admin/plugins/definitions/CmsEditorFieldValidatorFileTypePlugin";

export const documentFileType = new CmsEditorFieldValidatorFileTypePlugin({
    name: "documents",
    label: "Documents",
    message: "Only documents allowed."
});
