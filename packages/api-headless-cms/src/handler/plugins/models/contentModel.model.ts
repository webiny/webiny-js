import { validation } from "@webiny/validation";
import {
    pipe,
    withFields,
    string,
    withName,
    fields,
    object,
    ref,
    withHooks,
} from "@webiny/commodo";
import createFieldsModel from "./ContentModel/createFieldsModel";

const required = validation.create("required");

export default ({ createBase, context }) => {
    const ContentModelFieldsModel = createFieldsModel(context);

    const CmsContentModel = pipe(
        withName(`CmsContentModel`),
        withFields({
            title: string({
                validation: validation.create("required,maxLength:100"),
                value: "Untitled"
            }),
            modelId: string({ validation: validation.create("required,maxLength:100") }),
            description: string({ validation: validation.create("maxLength:200") }),
            layout: object({ value: [] }),
            group: ref({ instanceOf: context.models.CmsContentModelGroup, validation: required }),
            titleFieldId: string(),
            fields: fields({
                list: true,
                value: [],
                instanceOf: ContentModelFieldsModel
            })
        }),
        withHooks({
            async beforeSave() {
                // If no title field set, just use the first "text" field.
                const fields = this.fields || [];

                let hasTitleFieldId = false;
                if (this.titleFieldId && fields.find(item => item.fieldId === this.titleFieldId)) {
                    hasTitleFieldId = true;
                }

                if (!hasTitleFieldId) {
                    this.titleFieldId = null;
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        if (field.type === "text") {
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
                const modelIdExists = await CmsContentModel.count({
                    query: { modelId: this.modelId, parent: { $ne: this.parent } },
                    limit: 1
                });

                if (modelIdExists) {
                    throw new Error(`Model with model ID "${this.modelId}" already exists.`);
                }
            }
        })
    )(createBase());

    return CmsContentModel;
};
