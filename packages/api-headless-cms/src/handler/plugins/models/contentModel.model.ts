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
    setOnce
} from "@webiny/commodo";
import createFieldsModel from "./ContentModel/createFieldsModel";
import slugify from "slugify";
import shortid from "shortid";

const toSlug = text =>
    slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });

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
            modelId: setOnce()(string({ validation: validation.create("required,maxLength:100") })),
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
                // If there is a modelId assigned, check if it's unique ...
                if (this.modelId) {
                    const existing = await CmsContentModel.findOne({
                        query: { modelId: this.modelId }
                    });
                    if (existing) {
                        throw Error(`Content model with modelId "${this.modelId}" already exists.`);
                    }
                    return;
                }

                // ... otherwise, assign a unique modelId automatically.
                this.modelId = toSlug(this.title);
                const existing = await CmsContentModel.findOne({
                    query: { modelId: this.modelId }
                });
                if (!existing) {
                    return;
                }

                this.getField("modelId").valueSet = false;
                this.modelId = `${this.modelId}-${shortid.generate()}`;
            }
        })
    )(createBase());

    return CmsContentModel;
};
