import { validation } from "@webiny/validation";
import {
    pipe,
    withFields,
    string,
    withName,
    fields,
    object,
    date,
    number,
    boolean,
    ref,
    skipOnPopulate,
    withHooks,
    onSet,
    withProps
} from "@webiny/commodo";
import mdbid from "mdbid";
import createFieldsModel from "./ContentModel/createFieldsModel";
import withLatestVersion from "./ContentModel/withLatestVersion";

const required = validation.create("required");

export default ({ createBase, context }) => {
    const ContentModelFieldsModel = createFieldsModel(context);

    const CmsContentModel = pipe(
        withName(`CmsContentModel`),
        withFields(instance => ({
            title: string({ validation: required, value: "Untitled" }),
            modelId: string({ validation: required }),
            description: string({ validation: validation.create("maxLength:200") }),
            layout: object({ value: [] }),
            group: ref({ instanceOf: context.models.CmsContentModelGroup, validation: required }),
            titleFieldId: string(),
            fields: onSet(value => (instance.locked ? instance.fields : value))(
                fields({
                    list: true,
                    value: [],
                    instanceOf: ContentModelFieldsModel
                })
            ),
            publishedOn: skipOnPopulate()(date()),
            version: number(),
            parent: context.commodo.fields.id(),
            published: pipe(
                onSet(value => {
                    // Deactivate previously published revision
                    if (value && value !== instance.published && instance.isExisting()) {
                        instance.locked = true;
                        instance.publishedOn = new Date();
                        const removeBeforeSave = instance.hook("beforeSave", async () => {
                            removeBeforeSave();
                            await instance.hook("beforePublish");
                        });

                        const removeAfterSave = instance.hook("afterSave", async () => {
                            removeAfterSave();
                            await instance.hook("afterPublish");
                        });
                    }
                    return value;
                })
            )(boolean({ value: false })),
            locked: skipOnPopulate()(boolean({ value: false }))
        })),
        withHooks({
            async beforePublish() {
                // Deactivate previously published revision.
                const publishedRev = await CmsContentModel.findOne({
                    query: { published: true, parent: this.parent }
                });

                if (publishedRev) {
                    this.hook("afterPublish", async () => {
                        publishedRev.published = false;
                        await publishedRev.save();
                    });
                }
            },
            async afterPublish() {
                const environment = context.cms.getEnvironment();
                environment.changedOn = new Date();
                await environment.save();
            },
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
            },
            async beforeCreate() {
                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.parent) {
                    this.parent = this.id;
                }

                this.version = await this.getNextVersion();

                const modelIdExists = await CmsContentModel.count({
                    query: { modelId: this.modelId, parent: { $ne: this.parent } }
                });

                if (modelIdExists) {
                    throw new Error(`Model with model ID "${this.modelId}" already exists.`);
                }
            },
            async afterDelete() {
                // TODO: Make a check if the Content Model can be deleted.
                // TODO: We must search across entries in the Entries table.

                // If the deleted page is the root page - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions
                    const revisions = await CmsContentModel.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            }
        }),
        withLatestVersion(),
        withProps({
            async getNextVersion() {
                const revision = await CmsContentModel.findOne({
                    query: { parent: this.parent, deleted: { $in: [true, false] } },
                    sort: { version: -1 }
                });

                if (!revision) {
                    return 1;
                }

                return revision.version + 1;
            },
            get revisions() {
                // eslint-disable-next-line no-async-promise-executor
                return new Promise(async resolve => {
                    const revisions = await CmsContentModel.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                    resolve(revisions);
                });
            },
            get status() {
                if (this.published) {
                    return "published";
                }

                return this.locked ? "locked" : "draft";
            }
        })
    )(createBase());

    return CmsContentModel;
};
