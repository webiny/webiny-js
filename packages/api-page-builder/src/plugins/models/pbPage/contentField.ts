import { object } from "@webiny/commodo";
import cloneDeep from "lodash.clonedeep";

const isValidElement = element => {
    return element && element.type;
};

const getModifierPlugins = (elementType, modifierType, plugins) => {
    return plugins.byType("pb-page-element-modifier").filter(plugin => {
        if (plugin.elementType === "*" || plugin.elementType === elementType) {
            return typeof plugin[modifierType] === "function";
        }
        return false;
    });
};

const asyncModifiers = async ({ context, modifierType, element }) => {
    if (!isValidElement(element)) {
        return;
    }

    const plugins = getModifierPlugins(element.type, modifierType, context.plugins);

    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i];
        await plugin[modifierType]({ element, context });
    }

    if (Array.isArray(element.elements)) {
        for (let i = 0; i < element.elements.length; i++) {
            await asyncModifiers({ context, element: element.elements[i], modifierType });
        }
    }
};

export default ({ context, ...rest }) => {
    return object({
        ...rest,
        async getStorageValue() {
            // Not using getValue method because it would load the model without need.
            const element = cloneDeep(this.current);
            await asyncModifiers({
                context,
                element,
                modifierType: "getStorageValue"
            });

            return element;
        },
        async setStorageValue(element) {
            await asyncModifiers({
                context,
                element,
                modifierType: "setStorageValue"
            });
            this.setValue(element, { skipDifferenceCheck: true, forceSetAsClean: true });
            return this;
        }
    });
};
