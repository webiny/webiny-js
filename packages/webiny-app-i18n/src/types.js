// @flow
import { type PluginType } from "webiny-plugins/types";
import type { EditorPluginType, MenuPluginType } from "webiny-ui/RichTextEditor";

export type I18NInputRichTextEditorPluginType = PluginType & {
    plugin: {
        name: string,
        editor?: EditorPluginType,
        menu?: MenuPluginType
    }
};

export type I18NStringValueType = {
    value?: string,
    values: Array<{ locale: string, value: string }>
};

export type I18NObjectValueType = {
    value?: Object,
    values: Array<{ locale: string, value: Object }>
};
