// @flow
import { object } from "commodo-fields-object";

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

const syncModifiers = ({ context, modifierType, element }) => {
    if (!isValidElement(element)) {
        return;
    }

    const plugins = getModifierPlugins(element.type, modifierType, context.plugins);

    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i];
        plugin[modifierType]({ element, context });
    }

    if (Array.isArray(element.elements)) {
        for (let i = 0; i < element.elements.length; i++) {
            syncModifiers({ context, element: element.elements[i], modifierType });
        }
    }
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
        async getStorageValue(element) {
            await asyncModifiers({
                context,
                element,
                modifierType: "getStorageValue"
            });
            return element;
        },
        async setStorageValue(element) {
            syncModifiers({
                context,
                element,
                modifierType: "setStorageValue"
            });
            this.setValue(element, { skipDifferenceCheck: true, forceSetAsClean: true });
            return this;
        }
    });
};
