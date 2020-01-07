import React from "react";
import { Editor } from "slate-react";
import { Value } from "slate";
import { getPlugins } from "@webiny/plugins";
import {
    I18NStringValue,
    I18NObjectValue,
    I18NInputRichTextEditorPlugin
} from "@webiny/app-i18n/types";

export type EditorPlugin = {
    name: string;
}; // Slate plugin.

export type I18NValueProps = {
    value?: string | I18NStringValue | I18NObjectValue;
    default?: string | I18NStringValue | I18NObjectValue;
    editorPlugins?: Array<EditorPlugin>;
};

function getValue(valueObject?: string | I18NStringValue | I18NObjectValue): string {
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

    return valueObject.value as string || "";
}

export function I18NValue(props: I18NValueProps): any {
    if (!props) {
        return "";
    }

    const { value: valueObject, default: defaultObject } = props;

    let value: string;
    value = getValue(valueObject);
    if (!value) {
        value = getValue(defaultObject);
    }

    if (typeof value === "string") {
        return value;
    }

    let editorPlugins = getPlugins("i18n-value-rich-text-editor")
        .map((item: I18NInputRichTextEditorPlugin) => item.plugin.editor)
        .filter(Boolean);

    if (Array.isArray(props.editorPlugins)) {
        editorPlugins = [...editorPlugins, ...props.editorPlugins];
    }

    return <Editor readOnly plugins={editorPlugins} value={Value.fromJSON(value)} />;
}

export default I18NValue;
