import { CmsEntryOpenSearchValuesModifier } from "~/features/CmsEntryOpenSearchValuesModifier/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

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
    return createRegisterExtensionPlugin(({ container }) => {
        container.register(
            CmsEntryOpenSearchValuesModifier.createImplementation({
                implementation: class {
                    canModify() {
                        return true;
                    }
                    modify({ values: initialValues }) {
                        const values = structuredClone(initialValues);
                        if (params?.inherit) {
                            return { ...values, ...createGlobalModifierValues() };
                        }
                        return createGlobalModifierValues();
                    }
                },
                dependencies: []
            })
        );
    });
};

export const createTargetedModifierValues = () => {
    return {
        title: "A targeted modifier plugin."
    };
};
export const createTargetedModifierPlugin = (params?: ModifierParams) => {
    return createRegisterExtensionPlugin(({ container }) => {
        container.register(
            CmsEntryOpenSearchValuesModifier.createImplementation({
                implementation: class {
                    canModify(modelId) {
                        return modelId === "converter";
                    }
                    modify({ values: initialValues }) {
                        const values = structuredClone(initialValues);
                        if (params?.inherit) {
                            return { ...values, ...createTargetedModifierValues() };
                        }
                        return createTargetedModifierValues();
                    }
                },
                dependencies: []
            })
        );
    });
};

export const createNotApplicableModifierValues = () => {
    return {
        title: "This title should not be applied."
    };
};
export const createNotApplicableModifierPlugin = (params?: ModifierParams) => {
    return createRegisterExtensionPlugin(({ container }) => {
        container.register(
            CmsEntryOpenSearchValuesModifier.createImplementation({
                implementation: class {
                    canModify(modelId) {
                        return modelId === "converterNonExisting";
                    }
                    modify({ values: initialValues }) {
                        const values = structuredClone(initialValues);
                        if (params?.inherit) {
                            return { ...values, ...createNotApplicableModifierValues() };
                        }
                        return createNotApplicableModifierValues();
                    }
                },
                dependencies: []
            })
        );
    });
};
