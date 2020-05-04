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
    string
} from "@webiny/commodo";

import {
    CmsContext,
    CmsModel,
    CmsModelFieldToCommodoFieldPlugin
} from "@webiny/api-headless-cms/types";

import { withModelFiltering } from "./withModelFiltering";
import { createValidation } from "./createValidation";
import pick from "lodash/pick";
import omit from "lodash/omit";

export const createDataModelFromData = (
    createBase: Function,
    data: CmsModel,
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
                const toStorageData = await toStorage.call(this);
                const fieldIds = data.fields.map(item => item.fieldId);

                const fields = pick(toStorageData, fieldIds);
                const { meta, ...rest } = omit<any>(toStorageData, fieldIds);

                return { ...rest, ...meta, fields };
            },
            async populateFromStorage(storageData) {
                const metaFieldsList = Object.keys(this.meta.getFields());

                const meta = pick(storageData, metaFieldsList);
                const rest = omit<any>(storageData, metaFieldsList);

                return populateFromStorage.call(this, { ...rest, ...rest.fields, meta });
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
            async afterSave() {
                const SearchModel = context.models[data.modelId + "Search"];
                const locales = context.i18n.getLocales();

                for (let x = 0; x < locales.length; x++) {
                    const locale = locales[x];
                    const fieldValues = {
                        latestVersion: this.meta.latestVersion,
                        published: this.meta.published
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
                if (this.id === this.meta.parent) {
                    return;
                }

                if (this.meta.version > 1 && this.meta.latestVersion) {
                    this.meta.latestVersion = false;
                    const removeCallback = this.hook("afterDelete", async () => {
                        const previousLatestForm = await Model.findOne({
                            query: {
                                parent: this.parent
                            },
                            sort: {
                                version: -1
                            }
                        });
                        previousLatestForm.meta.latestVersion = true;
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
                if (this.id === this.meta.parent) {
                    // Delete all revisions
                    const revisions = await Model.find({
                        query: { parent: this.meta.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            },
            async beforePublish() {
                // TODO: check if this will cause any issues for Search catalog updates.
                // Deactivate previously published revision.
                const publishedRev = await Model.findOne({
                    query: { published: true, parent: this.meta.parent }
                });

                if (publishedRev) {
                    this.hook("afterPublish", async () => {
                        publishedRev.meta.published = false;
                        await publishedRev.save();
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
                            if (data.titleFieldId) {
                                return instance[data.titleFieldId];
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
                        model: setOnce()(string({ value: data.modelId })),
                        environment: setOnce()(context.commodo.fields.id()),
                        parent: context.commodo.fields.id(),
                        version: number(),
                        latestVersion: boolean(),
                        locked: skipOnPopulate()(boolean({ value: false })),
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
        withModelFiltering(data.modelId)
    )(createBase()) as Function;

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
            model: Model,
            validation: createValidation(field, context)
        });
    }

    return Model;
};
