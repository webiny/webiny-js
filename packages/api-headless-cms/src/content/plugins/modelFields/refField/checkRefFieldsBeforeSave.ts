import { withHooks } from "@webiny/commodo";

const checkRefFieldsBeforeSave = () => ({
    type: "context-before-content-models",
    name: "context-before-content-models-ref-field-check-referenced-model",
    apply(context) {
        const { CmsContentModel } = context.models;
        withHooks({
            async beforeSave() {
                const refFields = this.fields.filter(field => {
                    if (field.type !== "ref") {
                        return false;
                    }

                    const isLockedField = this.lockedFields.find(
                        item => item.fieldId === field.fieldId
                    );
                    return !isLockedField;
                });

                // Now that we have non-locked "ref" fields, let's check if the actual model that is referenced
                // is ready to be selected. In other words, we don't want to allow models without a title field,
                // because basically, all search inputs in the UI will stop working. And not only that, with this
                // check, we ensure that the referenced model contains at least one field. Otherwise, the GraphQL
                // schema that would be generated after saving this content model, would be invalid, and the
                // GraphQL server wouldn't be able to start.
                for (let i = 0; i < refFields.length; i++) {
                    const refField = refFields[i];
                    const contentModel = await CmsContentModel.findOne({
                        modelId: refField.settings.modelId
                    });

                    if (!contentModel.titleFieldId) {
                        throw new Error(
                            `Cannot save content model because the ref field "${refField.fieldId}" references a content model (${refField.settings.modelId}) that has no title field assigned.`
                        );
                    }
                }
            }
        })(CmsContentModel);
    }
});

export default checkRefFieldsBeforeSave;
