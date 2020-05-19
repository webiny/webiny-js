import mdbid from "mdbid";
import {
    pipe,
    withName,
    withHooks,
    withFields,
    withProps,
    fields,
    number,
    boolean,
    onSet,
    skipOnPopulate,
    setOnce,
    string,
    date,
    getName
} from "@webiny/commodo";

import {
    CmsContext,
    CmsContentModel,
    CmsModelFieldToCommodoFieldPlugin
} from "@webiny/api-headless-cms/types";

import { withModelFiltering } from "./withModelFiltering";
import { createValidation } from "./createValidation";
import pick from "lodash/pick";
import omit from "lodash/omit";

async function deleteRevisionIndexes(revision, context) {
    const { CmsContentEntrySearch } = context.models;
    const query = {
        model: revision.meta.model,
        revision: revision.id,
        environment: revision.meta.environment
    };

    await context.commodo.driver.delete({
        name: getName(CmsContentEntrySearch),
        options: { query }
    });
}

export const createDataModel = (
    createBase: Function,
    contentModel: CmsContentModel,
    context: CmsContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create content model
    const Model: any = pipe(
        withName("CmsContentEntry"),
        withProps(({ toStorage, populateFromStorage }) => ({
            async toStorage() {
                // When storing data to DB, we restructure data:
                // - all user-defined fields are stored in the `fields` object
                // - all other fields are moved to the root of the object (environment, locale, createdOn, createdBy, etc.)
                const toStorageData = await toStorage.call(this, { skipDifferenceCheck: true });
                const fieldIds = contentModel.fields.map(item => item.fieldId);

                const fields = pick(toStorageData, fieldIds);
                const { meta, ...rest } = omit<any>(toStorageData, fieldIds);

                return { ...rest, ...meta, fields };
            },
            async populateFromStorage(storageData) {
                // When loading data from DB, we restructure data:
                // - all user-defined fields which are stored in `fields` field are moved to the root of the model
                // - all system fields are moved to `meta` model field
                const metaFieldsList = Object.keys(this.meta.getFields());

                const meta = pick(storageData, metaFieldsList);
                const rest = omit<any>(storageData, metaFieldsList);

                return populateFromStorage.call(this, { ...rest, ...rest.fields, meta });
            },
            get contentModel() {
                return contentModel;
            }
        })),
        withHooks({
            async beforeCreate() {
                this.meta.environment = context.cms.getEnvironment().id;

                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.meta.parent) {
                    this.meta.parent = this.id;
                }

                this.meta.version = await this.getNextVersion();
                this.meta.latestVersion = true;

                if (this.meta.version > 1) {
                    const removeCallback = this.hook("afterCreate", async () => {
                        const previousLatest = await Model.findOne({
                            query: {
                                parent: this.meta.parent,
                                latestVersion: true,
                                version: { $ne: this.meta.version }
                            }
                        });

                        if (previousLatest) {
                            previousLatest.meta.latestVersion = false;
                            await previousLatest.save();
                        }
                        removeCallback();
                    });
                }
            },
            async beforeSave() {
                // Check if any of the index fields are dirty
                const indexFields = contentModel.getUniqueIndexFields();

                // Get entry fields that match indexes and are dirty
                const relFields = indexFields
                    .filter(f => Boolean(this[f]))
                    .map(f => this.getField(f).isDirty());

                // Determine if there are any dirty fields
                const dirty = relFields.filter(Boolean).length > 0;

                if (dirty) {
                    // If index related fields are dirty, we need to call DataManager to rebuild indexes
                    const removeCallback = this.hook("afterSave", async () => {
                        removeCallback();
                        await context.cms.dataManager.generateRevisionIndexes({ revision: this });
                    });
                }

                // Let's mark fields on actual content model as used.
                const fields = contentModel.fields || [];
                const usedFields = contentModel.usedFields || [];

                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];
                    if (usedFields.includes(field.fieldId)) {
                        continue;
                    }

                    const removeCallback = this.hook("afterSave", async () => {
                        removeCallback();

                        for (let i = 0; i < fields.length; i++) {
                            const fieldId = fields[i].fieldId;
                            if (usedFields.includes(fieldId)) {
                                continue;
                            }
                            usedFields.push(fieldId);
                        }

                        contentModel.usedFields = usedFields;
                        //TODO @adrian: await contentModel.save();
                    });
                    break;
                }
            },
            async beforeDelete() {
                // If parent is being deleted, do not do anything. Both parent and children will be deleted anyways.
                if (this.id === this.meta.parent) {
                    return;
                }

                if (this.meta.version > 1 && this.meta.latestVersion) {
                    this.meta.latestVersion = false;
                    const removeCallback = this.hook("afterDelete", async () => {
                        removeCallback();

                        const previousLatest = await Model.findOne({
                            query: {
                                parent: this.meta.parent
                            },
                            sort: {
                                version: -1
                            }
                        });

                        if (previousLatest) {
                            previousLatest.meta.latestVersion = true;
                            await previousLatest.save();
                        }
                    });
                }
            },
            async afterDelete() {
                // Delete indexes for this revision
                await deleteRevisionIndexes(this, context);

                // If the deleted page is the parent page - delete its revisions.
                if (this.id === this.meta.parent) {
                    // Delete all revisions
                    const revisions = await Model.find({
                        query: { parent: this.meta.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            },
            async beforePublish() {
                // Deactivate previously published revision.
                const publishedRev = await Model.findOne({
                    query: { published: true, parent: this.meta.parent }
                });

                if (publishedRev) {
                    this.hook("afterPublish", async () => {
                        publishedRev.meta.published = false;
                        await publishedRev.save();
                        // We only want to keep indexes for `published` and `latestVersion` revisions
                        if (!publishedRev.latestVersion) {
                            await deleteRevisionIndexes(publishedRev, context);
                        }
                    });
                }
            }
        }),
        withFields(instance => ({
            meta: fields({
                value: {},
                instanceOf: pipe(
                    withProps({
                        get title() {
                            if (contentModel.titleFieldId) {
                                return instance[contentModel.titleFieldId];
                            }

                            return "";
                        },
                        get status() {
                            if (this.published) {
                                return "published";
                            }

                            return this.locked ? "locked" : "draft";
                        },
                        get revisions() {
                            return Model.find({
                                query: { parent: this.parent },
                                sort: { version: -1 }
                            });
                        }
                    }),
                    withFields({
                        model: setOnce()(string({ value: contentModel.modelId })),
                        environment: setOnce()(context.commodo.fields.id()),
                        parent: context.commodo.fields.id(),
                        version: number(),
                        latestVersion: boolean(),
                        locked: skipOnPopulate()(boolean({ value: false })),
                        publishedOn: skipOnPopulate()(date()),
                        published: pipe(
                            onSet(value => {
                                // Deactivate previously published revision.
                                if (
                                    value &&
                                    value !== instance.meta.published &&
                                    instance.isExisting()
                                ) {
                                    instance.meta.locked = true;
                                    instance.meta.publishedOn = new Date();
                                    const removeBeforeSave = instance.hook(
                                        "beforeSave",
                                        async () => {
                                            removeBeforeSave();
                                            await instance.hook("beforePublish");
                                        }
                                    );

                                    const removeAfterSave = instance.hook("afterSave", async () => {
                                        removeAfterSave();
                                        await instance.hook("afterPublish");

                                        // When publishing a revision, we need to generate its indexes
                                        await context.cms.dataManager.generateRevisionIndexes({
                                            revision: instance
                                        });
                                    });
                                }
                                return value;
                            })
                        )(boolean({ value: false }))
                    })
                )()
            })
        })),
        withProps({
            async getNextVersion() {
                const revision = await Model.findOne({
                    query: { parent: this.meta.parent, deleted: { $in: [true, false] } },
                    sort: { version: -1 }
                });

                if (!revision) {
                    return 1;
                }

                return revision.meta.version + 1;
            }
        }),
        withModelFiltering(contentModel.modelId)
    )(createBase()) as Function;

    for (let i = 0; i < contentModel.fields.length; i++) {
        const field = contentModel.fields[i];
        const plugin = plugins.find(pl => pl.fieldType === field.type);
        if (!plugin) {
            throw Error(
                `Missing "cms-model-field-to-commodo-field" plugin for field type "${field.type}"`
            );
        }

        plugin.dataModel({
            context,
            field,
            model: Model,
            validation: createValidation(field, context)
        });
    }

    return Model;
};
