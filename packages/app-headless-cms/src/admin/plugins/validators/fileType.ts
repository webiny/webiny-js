import { plugins } from "@webiny/plugins";
import { CmsFieldValidatorFileTypePlugin } from "~/admin/plugins/definitions/CmsFieldValidatorFileTypePlugin";
import { CmsEditorFieldValidatorFileTypePlugin } from "~/admin/plugins/definitions/CmsEditorFieldValidatorFileTypePlugin";
import { CmsModelFieldValidatorPlugin } from "~/types";

export default (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-fileType",
        validator: {
            name: "fileType",
            validate: async (value, validator: CmsEditorFieldValidatorFileTypePlugin) => {
                if (!value) {
                    return true;
                }

                const { settings } = validator;

                const re: RegExp = null;
                if (settings.fileType === "custom") {
                    // re = new RegExp(settings.regex, settings.flags || "i");
                } else {
                    const fileTypePlugin = plugins
                        .byType<CmsFieldValidatorFileTypePlugin>(
                            CmsFieldValidatorFileTypePlugin.type
                        )
                        .find(item => item.getName() === settings.fileType);

                    if (!fileTypePlugin) {
                        console.log(
                            `Missing "CmsFieldValidatorFileTypePlugin" for "${settings.fileType}".`
                        );
                        return true;
                    }
                    // re = fileTypePlugin.getRegEx();
                }

                if (!re) {
                    return true;
                } else if (re instanceof RegExp) {
                    return re.test(value);
                }
                return false;
            }
        }
    };
};
