import { validation } from "@webiny/validation";
import {
    pipe,
    withFields,
    withProps,
    string,
    withName,
    fields,
    object,
    ref,
    withHooks,
    setOnce,
    skipOnPopulate
} from "@webiny/commodo";
import createFieldsModel from "./ContentModel/createFieldsModel";
import createLockedFieldsModel from "./ContentModel/createLockedFieldsModel";
import camelCase from "lodash/camelCase";
import pluralize from "pluralize";
import { indexes } from "./indexesField";
import { CmsContext } from "@webiny/api-headless-cms/types";

const required = validation.create("required");

export default ({ createBase, context }: { createBase: Function; context: CmsContext }) => {
    const ContentModelFieldsModel = createFieldsModel(context);
    const LockedFieldsModel = createLockedFieldsModel();

    const CmsContentModel = pipe(
        withName(`CmsContentModel`),
        withFields({
            name: string({
                validation: validation.create("required,maxLength:100"),
                value: "Untitled"
            }),
            modelId: setOnce()(string({ validation: validation.create("required,maxLength:100") })),
            description: string({ validation: validation.create("maxLength:200") }),
            layout: object({ value: [] }),
            group: ref({ instanceOf: context.models.CmsContentModelGroup, validation: required }),
            titleFieldId: string(),

            // Contains a list of all fields that were utilized by existing content entries. If a field is on the list,
            // it cannot be removed/edited anymore.
            lockedFields: skipOnPopulate()(fields({ list: true, instanceOf: LockedFieldsModel })),
            fields: fields({
                list: true,
                value: [],
                instanceOf: ContentModelFieldsModel
            }),
            indexes: indexes()
        }),
        withProps({
            get totalFields() {
                return Array.isArray(this.fields) ? this.fields.length : 0;
            },
            pluralizedName() {
                if (!this.name) {
                    return "";
                }

                return pluralize(this.name);
            },
            pluralizedModelId() {
                if (!this.modelId) {
                    return "";
                }

                return pluralize(this.modelId);
            },
            getUniqueIndexFields() {
                const indexFields = [];
                this.indexes.forEach(({ fields }) => {
                    fields.forEach(field => indexFields.push(field));
                });
                return [...new Set(indexFields)];
            }
        }),
        withHooks({
            async beforeDelete() {
                const Model = context.models[this.modelId];
                if (await Model.findOne()) {
                    throw new Error(
                        "Cannot delete content model because there are existing entries."
                    );
                }
            },
            async beforeSave() {
                if (this.getField("indexes").isDirty()) {
                    const removeCallback = this.hook("afterSave", async () => {
                        removeCallback();

                        await context.cms.dataManager.generateContentModelIndexes({
                            contentModel: this
                        });
                    });
                }

                const fields = this.fields || [];

                // If no title field set, just use the first "text" field.
                let hasTitleFieldId = false;
                if (this.titleFieldId && fields.find(item => item.fieldId === this.titleFieldId)) {
                    hasTitleFieldId = true;
                }

                if (!hasTitleFieldId) {
                    this.titleFieldId = null;
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        if (field.type === "text" && !field.multipleValues) {
                            this.titleFieldId = field.fieldId;
                            break;
                        }
                    }
                }

                if (this.titleFieldId) {
                    const field = fields.find(item => item.fieldId === this.titleFieldId);
                    if (field.type !== "text") {
                        throw new Error("Only text fields can be used as an entry title.");
                    }

                    if (field.multipleValues) {
                        throw new Error(
                            `Fields that accept multiple values cannot be used as the entry title (tried to use "${this.titleFieldId}" field)`
                        );
                    }

                    // When a field is set as a title field, we automatically create an index, so that we can
                    // immediately search entries by its title. Convenient for users, and ensures there is always
                    // at least one field we can do a search with. Makes generic auto-complete / multi-auto-complete
                    // components possible.
                    let indexAlreadyExists = false;
                    for (let i = 0; i < this.indexes.length; i++) {
                        const index = this.indexes[i];
                        if (
                            Array.isArray(index.fields) &&
                            index.fields.length === 1 &&
                            index.fields[0] === this.titleFieldId
                        ) {
                            indexAlreadyExists = true;
                            break;
                        }
                    }

                    if (!indexAlreadyExists) {
                        this.indexes = [
                            ...this.indexes,
                            {
                                fields: [this.titleFieldId]
                            }
                        ];
                    }
                }

                // We must not allow removal or changes in fields that are already in use in content entries.
                const lockedFields = this.lockedFields || [];
                for (let i = 0; i < lockedFields.length; i++) {
                    const lockedField = lockedFields[i];
                    const existingField = this.fields.find(
                        item => item.fieldId === lockedField.fieldId
                    );
                    if (!existingField) {
                        throw new Error(
                            `Cannot remove the field "${lockedField.fieldId}" because it's already in use in created content.`
                        );
                    }

                    if (lockedField.multipleValues !== existingField.multipleValues) {
                        throw new Error(
                            `Cannot change "multipleValues" for the "${lockedField.fieldId}" field because it's already in use in created content.`
                        );
                    }
                }

                // Check if the indexes list contains all fields that actually exists.
                for (let i = 0; i < this.indexes.length; i++) {
                    const index = this.indexes[i];
                    if (Array.isArray(index.fields)) {
                        for (let j = 0; j < index.fields.length; j++) {
                            const field = index.fields[j];
                            // "id" is built-in, no need to do any checks here.
                            if (field === "id") {
                                continue;
                            }
                            if (!this.fields.find(item => item.fieldId === field)) {
                                throw new Error(
                                    `Before removing the "${field}" field, please remove all of the indexes that include it in in their list of fields.`
                                );
                            }
                        }
                    }
                }

                if (this.isDirty()) {
                    const removeCallback = this.hook("afterSave", async () => {
                        removeCallback();
                        const environment = context.cms.getEnvironment();
                        environment.changedOn = new Date();
                        await environment.save();
                    });
                }
            },
            async beforeCreate() {
                // If there is a modelId assigned, check if it's unique ...
                if (this.modelId) {
                    this.getField("modelId").state.set = false;
                    this.modelId = camelCase(this.modelId);

                    const existing = await CmsContentModel.findOne({
                        query: { modelId: this.modelId }
                    });
                    if (existing) {
                        throw Error(`Content model with modelId "${this.modelId}" already exists.`);
                    }
                    return;
                }

                // ... otherwise, assign a unique modelId automatically.
                const modelIdCamelCase = camelCase(this.name);
                let modelId;
                let counter = 0;

                while (true) {
                    modelId = modelIdCamelCase;
                    if (counter) {
                        modelId += counter;
                    }

                    const exists = await CmsContentModel.count({
                        query: { modelId },
                        limit: 1
                    });

                    if (!exists) {
                        break;
                    }

                    counter++;
                }

                this.getField("modelId").state.set = false;
                this.modelId = modelId;
            }
        })
    )(createBase());

    return CmsContentModel;
};
