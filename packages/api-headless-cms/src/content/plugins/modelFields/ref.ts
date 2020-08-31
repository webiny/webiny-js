import {
    CmsModelFieldToCommodoFieldPlugin,
    CmsModelLockedFieldPlugin
} from "@webiny/api-headless-cms/types";
import {
    withFields,
    ref,
    pipe,
    withName,
    string,
    withStaticProps,
    withHooks,
    onSet,
    onGet
} from "@webiny/commodo";
import { i18nField } from "./i18nFields";
import cloneDeep from "lodash/cloneDeep";
import upperFirst from "lodash/upperFirst";

const modifyQueryArgs = (args = {}, environment, valuesModel, entry1FieldId) => {
    if (!valuesModel.locale) {
        throw Error(`Locale is missing for field ${entry1FieldId}.`);
    }

    const returnArgs = cloneDeep<any>(args);
    if (returnArgs.query) {
        returnArgs.query = {
            $and: [{ locale: valuesModel.locale, entry1FieldId }, returnArgs.query]
        };
    } else {
        returnArgs.query = { locale: valuesModel.locale, entry1FieldId };
    }

    return returnArgs;
};

const forEachLocaleValue = async (fieldValue, callback) => {
    if (fieldValue && Array.isArray(fieldValue.values)) {
        for (let i = 0; i < fieldValue.values.length; i++) {
            const localeValue = await fieldValue.values[i].value;
            if (localeValue) {
                callback(localeValue);
            }
        }
    }
};

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-ref",
    type: "cms-model-field-to-commodo-field",
    fieldType: "ref",
    dataModel({ model, field, validation, context }) {
        const { modelId } = field.settings;

        return pipe(
            withHooks({
                async beforePublish() {
                    const fieldValue = await this[field.fieldId];
                    if (field.multipleValues) {
                        await forEachLocaleValue(fieldValue, localeValues => {
                            if (Array.isArray(localeValues)) {
                                for (let i = 0; i < localeValues.length; i++) {
                                    const localeValue = localeValues[i];
                                    if (localeValue && !localeValue.meta.published) {
                                        throw new Error(
                                            `Cannot publish - "${field.fieldId}" points to an unpublished content entry.`
                                        );
                                    }
                                }
                            }
                        });
                        return;
                    }

                    await forEachLocaleValue(fieldValue, localeValue => {
                        if (localeValue && !localeValue.meta.published) {
                            throw new Error(
                                `Cannot publish - "${field.fieldId}" points to an unpublished content entry.`
                            );
                        }
                    });
                }
            }),
            withFields(instance => ({
                [field.fieldId]: i18nField({
                    name: upperFirst(field.fieldId),
                    createField: valuesModel => {
                        const instanceOf = Object.values(context.models.contentModels);

                        // We create a custom CmsEntries2Entries model in runtime, on which we added locale filtering.
                        const CmsEntries2Entries = pipe(
                            withName("CmsEntries2Entries"),
                            withFields(instance => ({
                                locale: string(),
                                entry1: ref({
                                    instanceOf,
                                    refNameField: "entry1ModelId"
                                }),
                                entry1ModelId: string(),
                                entry1FieldId: string({ value: field.fieldId }),
                                entry2: ref({
                                    instanceOf,
                                    refNameField: "entry2ModelId",
                                    findRefArgs: () => {
                                        const parent = instance.entry2ParentId;

                                        // Backwards compatibility: if there's no parent set, that means we're dealing
                                        // with an old record, and we'll just going to load data the old-fashioned way.
                                        // Yes, that means the users will need to save their existing models in order
                                        // for the new functionality to work.
                                        if (!parent) {
                                            return {
                                                query: {
                                                    id: instance.entry2ModelId
                                                }
                                            };
                                        }

                                        // If we are in the MANAGE API, then we always need to load the latest revision.
                                        if (context.cms.MANAGE) {
                                            return {
                                                query: {
                                                    parent,
                                                    latestVersion: true
                                                }
                                            };
                                        }
                                        // Otherwise, we need to load the published one.
                                        return {
                                            query: {
                                                parent,
                                                published: true
                                            }
                                        };
                                    }
                                }),
                                entry2ModelId: string({ value: modelId }),
                                entry2ParentId: string()
                            })),
                            withHooks({
                                async beforeSave() {
                                    if (!valuesModel.locale) {
                                        throw Error(
                                            `Locale is missing for field ${field.fieldId}.`
                                        );
                                    }

                                    this.locale = valuesModel.locale;
                                    const entry2 = await this.entry2;
                                    if (entry2) {
                                        this.entry2ParentId = entry2.meta.parent;
                                    }
                                }
                            }),
                            withStaticProps(({ find, count, findOne }) => ({
                                find(args) {
                                    const environment = context.cms.getEnvironment();
                                    return find.call(
                                        this,
                                        modifyQueryArgs(
                                            args,
                                            environment,
                                            valuesModel,
                                            field.fieldId
                                        )
                                    );
                                },
                                count(args) {
                                    const environment = context.cms.getEnvironment();
                                    return count.call(
                                        this,
                                        modifyQueryArgs(
                                            args,
                                            environment,
                                            valuesModel,
                                            field.fieldId
                                        )
                                    );
                                },
                                findOne(args) {
                                    const environment = context.cms.getEnvironment();
                                    return findOne.call(
                                        this,
                                        modifyQueryArgs(
                                            args,
                                            environment,
                                            valuesModel,
                                            field.fieldId
                                        )
                                    );
                                }
                            }))
                        )(context.models.createEnvironmentBase());

                        return pipe(
                            onSet(value => {
                                if (Array.isArray(value)) {
                                    return value;
                                }

                                return [value].filter(Boolean);
                            }),
                            onGet(async value => {
                                if (field.multipleValues) {
                                    const awaitedValue = await value;

                                    // Why this? Simply because in the READ API, we only return published revisions,
                                    // and if a user unpublishes a particular revision, the user will null instead
                                    // of of just nothing. So for example, instead of [], users might get [null, {...}].
                                    // This won't happen on the MANAGE API since there we always deal with latest
                                    // revisions, and there is always a latest revision.
                                    return Array.isArray(awaitedValue)
                                        ? awaitedValue.filter(Boolean)
                                        : awaitedValue;
                                }

                                const awaitedValue = await value;
                                return awaitedValue && awaitedValue[0];
                            })
                        )(
                            ref({
                                list: true,
                                parent: instance,
                                validation,
                                instanceOf: [context.models[modelId], "entry1"],
                                using: [CmsEntries2Entries, "entry2"]
                            })
                        );
                    },
                    context
                })
            }))
        )(model);
    }
};

const lockedFieldPlugin: CmsModelLockedFieldPlugin = {
    name: "cms-model-locked-field-ref",
    type: "cms-model-locked-field",
    fieldType: "ref",
    checkLockedField({ lockedField, field }) {
        if (lockedField.modelId && lockedField.modelId !== field.settings.modelId) {
            throw new Error(
                `Cannot change "modelId" for the "${lockedField.fieldId}" field because it's already in use in created content.`
            );
        }
    },
    getLockedFieldData({ field }) {
        return {
            modelId: field.settings.modelId
        };
    }
};

export default [plugin, lockedFieldPlugin];
