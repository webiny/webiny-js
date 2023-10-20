import { CmsEntryElasticsearchValuesModifier } from "~/plugins";

interface ModifierParams {
    inherit?: boolean;
}

export const createGlobalModifierValues = () => {
    return {
        title: "A global modifier plugin.",
        age: 25
    };
};
export const createGlobalModifierPlugin = (params?: ModifierParams) => {
    const plugin = new CmsEntryElasticsearchValuesModifier(({ setValues }) => {
        setValues(prev => {
            if (params?.inherit) {
                return {
                    ...prev,
                    ...createGlobalModifierValues()
                };
            }
            return createGlobalModifierValues();
        });
    });
    plugin.name = "headlessCms.test.global.elasticsearchValueModifier";
    return plugin;
};

export const createTargetedModifierValues = () => {
    return {
        title: "A targeted modifier plugin."
    };
};
export const createTargetedModifierPlugin = (params?: ModifierParams) => {
    const plugin = new CmsEntryElasticsearchValuesModifier({
        models: ["converter"],
        modifier: ({ setValues }) => {
            setValues(prev => {
                if (params?.inherit) {
                    return {
                        ...prev,
                        ...createTargetedModifierValues()
                    };
                }
                return createTargetedModifierValues();
            });
        }
    });
    plugin.name = "headlessCms.test.targeted.elasticsearchValueModifier";
    return plugin;
};

export const createNotApplicableModifierValues = () => {
    return {
        title: "This title should not be applied."
    };
};
export const createNotApplicableModifierPlugin = (params?: ModifierParams) => {
    const plugin = new CmsEntryElasticsearchValuesModifier({
        models: ["converterNonExisting"],
        modifier: ({ setValues }) => {
            setValues(prev => {
                if (params?.inherit) {
                    return {
                        ...prev,
                        ...createNotApplicableModifierValues()
                    };
                }
                return createNotApplicableModifierValues();
            });
        }
    });

    plugin.name = "headlessCms.test.notApplicable.elasticsearchValueModifier";
    return plugin;
};
