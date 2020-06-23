import { withFields, pipe, string, withProps, withHooks, fields } from "@webiny/commodo";

const RefFieldListItemModel = withFields({
    modelId: string({ validation: "required" }),
    fieldId: string({ validation: "required" })
})();

export default () => {
    return {
        type: "context-before-content-models",
        name: "context-before-content-models-ref-field-hooks",
        apply(context) {
            const { CmsContentModel } = context.models;
            pipe(
                withFields(() => ({
                    refFields: fields({
                        list: true,
                        value: [],
                        instanceOf: RefFieldListItemModel
                    }),
                    referencedIn: fields({
                        list: true,
                        value: [],
                        instanceOf: RefFieldListItemModel
                    })
                })),
                withHooks({
                    beforeDelete() {
                        // Prevent deletion of content model was referenced in another content model.
                        for (let i = 0; i < this.referencedIn.length; i++) {
                            const item = this.referencedIn[i];
                            throw new Error(
                                `Cannot delete content model because it's referenced in the "${item.modelId}" model ("${item.fieldId}" field).`
                            );
                        }
                    },
                    async beforeSave() {
                        // If content model is referenced in "ref" fields of other models, prevent removing all fields.
                        // This is because the model will be removed from the GraphQL schema and make it invalid.
                        if (!this.totalFields) {
                            for (let i = 0; i < this.referencedIn.length; i++) {
                                const item = this.referencedIn[i];
                                throw new Error(
                                    `Cannot remove all fields because the content model because it's referenced in the "${item.modelId}" model ("${item.fieldId}" field).`
                                );
                            }
                        }
                    }
                }),
                withHooks({
                    async beforeSave() {
                        if (!Array.isArray(this.fields)) {
                            this.fields = [];
                        }

                        if (!Array.isArray(this.refFields)) {
                            this.refFields = [];
                        }

                        const refFields = [];
                        const changesOnRefFields = {
                            added: [],
                            removed: []
                        };

                        for (let i = 0; i < this.fields.length; i++) {
                            const field = this.fields[i];
                            if (field.type !== "ref") {
                                continue;
                            }

                            const refFieldsItem = {
                                fieldId: field.fieldId,
                                modelId: field.settings.modelId
                            };

                            const fieldListedInRefFields = this.refFields.find(
                                item => item.fieldId === field.fieldId
                            );

                            if (!fieldListedInRefFields) {
                                changesOnRefFields.added.push(refFieldsItem);
                            }

                            // Let's also create an up-to-date list of ref fields.
                            refFields.push(refFieldsItem);
                        }

                        for (let i = 0; i < this.refFields.length; i++) {
                            const refFieldsField = this.refFields[i];
                            const refFieldListedInFields = this.fields.find(
                                field => field.fieldId === refFieldsField.fieldId
                            );

                            if (!refFieldListedInFields) {
                                changesOnRefFields.removed.push(refFieldsField);
                            }
                        }

                        this.refFields = refFields;

                        if (
                            changesOnRefFields.added.length === 0 &&
                            changesOnRefFields.removed.length === 0
                        ) {
                            return;
                        }

                        const removeCallback = this.hook("afterSave", async () => {
                            removeCallback();
                            const loadedContentModels = {};
                            const contentModelsToSave = {};

                            // Let's optimize loading of content models - we don't want to make redundant database queries.
                            const getContentModel = async modelId => {
                                if (loadedContentModels[modelId]) {
                                    return loadedContentModels[modelId];
                                }

                                const { CmsContentModel } = context.models;
                                const contentModel = await CmsContentModel.findOne({
                                    query: { modelId }
                                });

                                if (!contentModel) {
                                    throw new Error(
                                        `Could not load "${modelId}" model while managing "ref" fields on "${this.modelId}" model.`
                                    );
                                }

                                if (!Array.isArray(contentModel.referencedIn)) {
                                    contentModel.referencedIn = [];
                                }

                                loadedContentModels[modelId] = contentModel;
                                return loadedContentModels[modelId];
                            };

                            // Let's first add added ref fields to referenced models (into the "refFields" field).
                            for (let i = 0; i < changesOnRefFields.added.length; i++) {
                                const addedRefField = changesOnRefFields.added[i];

                                const referencedContentModel = await getContentModel(
                                    addedRefField.modelId
                                );

                                referencedContentModel.referencedIn = [
                                    ...referencedContentModel.referencedIn,
                                    {
                                        modelId: this.modelId,
                                        fieldId: addedRefField.fieldId
                                    }
                                ];

                                contentModelsToSave[
                                    referencedContentModel.modelId
                                ] = referencedContentModel;
                            }

                            // Now, let's remove removed ref fields in the referenced models' "refFields" field.
                            for (let i = 0; i < changesOnRefFields.removed.length; i++) {
                                const removedRefField = changesOnRefFields.removed[i];
                                const referencedContentModel = await getContentModel(
                                    removedRefField.modelId
                                );

                                const newReferencedIn = [...referencedContentModel.referencedIn];
                                const index = newReferencedIn.findIndex(
                                    item =>
                                        item.fieldId === removedRefField.fieldId &&
                                        item.modelId === this.modelId
                                );

                                if (index >= 0) {
                                    newReferencedIn.splice(index, 1);
                                    referencedContentModel.referencedIn = newReferencedIn;
                                    contentModelsToSave[
                                        referencedContentModel.modelId
                                    ] = referencedContentModel;
                                }
                            }

                            const contentModelsToSaveArray = Object.values(contentModelsToSave);
                            for (let i = 0; i < contentModelsToSaveArray.length; i++) {
                                // @ts-ignore
                                await contentModelsToSaveArray[i].save();
                            }
                        });
                    }
                })
            )(CmsContentModel);
        }
    };
};
