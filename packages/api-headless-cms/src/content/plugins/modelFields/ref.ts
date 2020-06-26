import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
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
                            withFields(() => ({
                                locale: string(),
                                entry1: ref({ instanceOf, refNameField: "entry1ModelId" }),
                                entry1ModelId: string(),
                                entry1FieldId: string({ value: field.fieldId }),
                                entry2: ref({ instanceOf, refNameField: "entry2ModelId" }),
                                entry2ModelId: string({ value: modelId })
                            })),
                            withHooks({
                                beforeSave() {
                                    if (!valuesModel.locale) {
                                        throw Error(
                                            `Locale is missing for field ${field.fieldId}.`
                                        );
                                    }

                                    this.locale = valuesModel.locale;
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
                                    return value;
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
    },
    createLockedFieldModel({ model }) {
        withFields({
            modelId: string()
        })(model);
    }
};

export default plugin;
