import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import {
    withFields,
    ref,
    pipe,
    withName,
    string,
    withStaticProps,
    withHooks,
    setOnce
} from "@webiny/commodo";
import { i18nField } from "./i18nFields";
import cloneDeep from "lodash/cloneDeep";
import upperFirst from "lodash/upperFirst";

const modifyQueryArgs = (args = {}, environment, valuesModel) => {
    if (!valuesModel.locale) {
        throw Error("modifyQueryArgs kobasico");
    }

    const returnArgs = cloneDeep<any>(args);
    if (returnArgs.query) {
        returnArgs.query = {
            $and: [{ locale: valuesModel.locale }, returnArgs.query]
        };
    } else {
        returnArgs.query = { locale: valuesModel.locale };
    }

    return returnArgs;
};

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-ref",
    type: "cms-model-field-to-commodo-field",
    fieldType: "ref",
    dataModel({ model, field, validation, context }) {
        const { modelId } = field.settings;

        return withFields(instance => ({
            [field.fieldId]: i18nField({
                name: upperFirst(field.fieldId),
                createField: valuesModel => {
                    const instanceOf = Object.values(context.models.contentModels);

                    // We create a custom CmsEntries2Entries model in runtime, on which we added locale filtering.
                    const CmsEntries2Entries = pipe(
                        withName("CmsEntries2Entries"),
                        withFields(() => ({
                            locale: setOnce()(string()),
                            entry1: ref({ instanceOf, refNameField: "entry1ClassId" }),
                            entry1ClassId: string(),
                            entry2: ref({ instanceOf, refNameField: "entry2ClassId" }),
                            entry2ClassId: string()
                        })),
                        withHooks({
                            beforeSave() {
                                if (!valuesModel.locale) {
                                    throw Error("modifyQueryArgs kobasico");
                                }
                                this.locale = valuesModel.locale;
                            }
                        }),
                        withStaticProps(({ find, count, findOne }) => ({
                            find(args) {
                                const environment = context.cms.getEnvironment();
                                return find.call(
                                    this,
                                    modifyQueryArgs(args, environment, valuesModel)
                                );
                            },
                            count(args) {
                                const environment = context.cms.getEnvironment();
                                return count.call(
                                    this,
                                    modifyQueryArgs(args, environment, valuesModel)
                                );
                            },
                            findOne(args) {
                                const environment = context.cms.getEnvironment();
                                return findOne.call(
                                    this,
                                    modifyQueryArgs(args, environment, valuesModel)
                                );
                            }
                        }))
                    )(context.models.createEnvironmentBase());

                    return ref({
                        list: true,
                        parent: instance,
                        validation,
                        instanceOf: [context.models[modelId], "entry1"],
                        using: [CmsEntries2Entries, "entry2"]
                    });
                },
                context
            })
        }))(model);
    }
};

export default plugin;
