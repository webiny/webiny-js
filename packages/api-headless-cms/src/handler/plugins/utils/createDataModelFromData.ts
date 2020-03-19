import { flow } from "lodash";
import mdbid from "mdbid";
import {
    withName,
    withHooks,
    withFields,
    withProps,
    number,
    boolean,
    onSet,
    skipOnPopulate
} from "@webiny/commodo";

import {
    CmsGraphQLContext,
    CmsModel,
    CmsModelFieldToCommodoFieldPlugin
} from "@webiny/api-headless-cms/types";

import { createValidation } from "./createValidation";

export const createDataModelFromData = (
    baseModel: Function,
    data: CmsModel,
    context: CmsGraphQLContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create base model to be enhanced by field plugins
    const model = flow(
        withName(`${data.title}_${context.cms.environment}`),
        withHooks({
            async beforeCreate() {
                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.parent) {
                    this.parent = this.id;
                }

                this.version = await this.getNextVersion();
                this.latestVersion = true;

                if (this.version > 1) {
                    const removeCallback = this.hook("afterCreate", async () => {
                        const previousLatest = await this.constructor.findOne({
                            query: {
                                parent: this.parent,
                                latestVersion: true,
                                version: { $ne: this.version }
                            }
                        });

                        if (previousLatest) {
                            previousLatest.latestVersion = false;
                            await previousLatest.save();
                        }
                        removeCallback();
                    });
                }
            },
            async afterSave() {
                const SearchModel = context.models[data.modelId + "Search"];
                const locales = context.i18n.getLocales();

                for (let x = 0; x < locales.length; x++) {
                    const locale = locales[x];
                    const fieldValues = {
                        latestVersion: this.latestVersion,
                        published: this.published,
                    };
                    for (let y = 0; y < data.fields.length; y++) {
                        const field = data.fields[y];
                        fieldValues[field.fieldId] = await this[field.fieldId].value(locale.code);
                    }

                    // Create/Update search entry
                    const entry = {
                        locale: locale.id,
                        revision: this.id
                    };

                    const searchEntry = await SearchModel.findOne({ query: entry });
                    if (searchEntry) {
                        searchEntry.populate(fieldValues);
                        await searchEntry.save();
                    } else {
                        const searchEntry = new SearchModel();
                        searchEntry.populate({
                            ...entry,
                            ...fieldValues
                        });
                        await searchEntry.save();
                    }
                }
            },
            async beforeDelete() {
                // If parent is being deleted, do not do anything. Both parent and children will be deleted anyways.
                if (this.id === this.parent) {
                    return;
                }

                if (this.version > 1 && this.latestVersion) {
                    this.latestVersion = false;
                    const removeCallback = this.hook("afterDelete", async () => {
                        const previousLatestForm = await this.constructor.findOne({
                            query: {
                                parent: this.parent
                            },
                            sort: {
                                version: -1
                            }
                        });
                        previousLatestForm.latestVersion = true;
                        await previousLatestForm.save();

                        removeCallback();
                    });
                }
            },
            async afterDelete() {
                // Delete Search collection records for this specific revision
                const SearchModel = context.models[data.modelId + "Search"];
                const entries = await SearchModel.find({
                    query: { revision: this.id }
                });

                for (let i = 0; i < entries.length; i++) {
                    await entries[i].delete();
                }

                // If the deleted page is the root page - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions
                    const revisions = await this.constructor.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            }
        }),
        withFields(instance => ({
            parent: context.commodo.fields.id(),
            version: number(),
            latestVersion: boolean(),
            locked: skipOnPopulate()(boolean({ value: false })),
            published: onSet(value => {
                // Deactivate previously published revision
                if (value && value !== instance.published) {
                    instance.locked = true;
                    instance.publishedOn = new Date();
                    const removeBeforeSave = instance.hook("beforeSave", async () => {
                        removeBeforeSave();
                        // Deactivate previously published revision
                        const publishedRev = await instance.constructor.findOne({
                            query: { published: true, parent: instance.parent }
                        });

                        if (publishedRev) {
                            publishedRev.published = false;
                            await publishedRev.save();
                        }
                    });

                    const removeAfterSave = instance.hook("afterSave", async () => {
                        removeAfterSave();
                        await instance.hook("afterPublish");
                    });
                }
                return value;
            })(boolean({ value: false }))
        })),
        withProps({
            async getNextVersion() {
                const revision = await this.constructor.findOne({
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
                    const revisions = await this.constructor.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                    resolve(revisions);
                });
            }
        })
    )(baseModel) as Function;

    for (let i = 0; i < data.fields.length; i++) {
        const field = data.fields[i];
        const plugin = plugins.find(pl => pl.fieldType === field.type);
        if (!plugin) {
            throw Error(
                `Missing "cms-model-field-to-commodo-field" plugin for field type "${field.type}"`
            );
        }

        plugin.dataModel({
            context,
            field,
            model,
            validation: createValidation(field, context)
        });
    }

    return model;
};
