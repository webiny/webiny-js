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
