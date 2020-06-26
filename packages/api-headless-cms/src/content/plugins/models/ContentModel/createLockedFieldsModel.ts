import { validation } from "@webiny/validation";
import { withFields, string, setOnce, boolean } from "@webiny/commodo";
import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";

const requiredShortString = validation.create("required,maxLength:256");

export default context => {
    const model = withFields({
        fieldId: setOnce()(string({ validation: requiredShortString })),
        type: setOnce()(string({ validation: requiredShortString })),
        multipleValues: boolean({ value: false })
    })();

    context.plugins
        .byType("cms-model-field-to-commodo-field")
        .forEach((plugin: CmsModelFieldToCommodoFieldPlugin) => {
            if (plugin.createLockedFieldModel) {
                // Add dynamic `fields` to `lockedFields` from field plugin
                plugin.createLockedFieldModel({ model });
            }
        });

    return model;
};
