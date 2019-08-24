// @flow
import React from "react";
import { Editor } from "slate-react";
import { Value } from "slate";
import { getPlugins } from "@webiny/plugins";
import type { I18NStringValueType, I18NObjectValueType } from "@webiny/app-i18n/types";

export type EditorPluginType = Object & {
    name: string
}; // Slate plugin.

export type Props = {
    value?: ?string | ?I18NStringValueType | ?I18NObjectValueType,
    default?: ?string | ?I18NStringValueType | ?I18NObjectValueType,
    editorPlugins?: Array<EditorPluginType>
};

function getValue(valueObject: ?string | ?Object) {
    if (!valueObject) {
        return "";
    }

    if (typeof valueObject === "string") {
        return valueObject;
    }

    if (Array.isArray(valueObject.values)) {
        const [defaultLocaleValue] = valueObject.values;
        if (defaultLocaleValue && defaultLocaleValue.value) {
            return defaultLocaleValue.value;
        }
        return "";
    }

    return valueObject.value || "";
}

export function I18NValue(props: Props) {
    if (!props) {
        return "";
    }

    const { value: valueObject, default: defaultObject } = props;

    let value;
    value = getValue(valueObject);
    if (!value) {
        value = getValue(defaultObject);
    }

    if (typeof value === "string") {
        return value;
    }

    let editorPlugins = getPlugins("i18n-value-rich-text-editor")
        .map(item => item.plugin.editor)
        .filter(Boolean);

    if (Array.isArray(props.editorPlugins)) {
        editorPlugins = [...editorPlugins, ...props.editorPlugins];
    }

    return <Editor readOnly plugins={editorPlugins} value={Value.fromJSON(value)} />;
}

export default I18NValue;
