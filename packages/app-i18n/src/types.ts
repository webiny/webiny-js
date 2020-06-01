import { Plugin } from "@webiny/app/types";
import { MenuPlugin, EditorPlugin } from "@webiny/ui/RichTextEditor";

export type I18NInputRichTextEditorPlugin = Plugin & {
    plugin: {
        name: string;
        editor?: EditorPlugin;
        menu?: MenuPlugin;
    };
};

export type I18NStringValue = {
    value?: string;
    values: Array<{ locale: string; value: string }>;
};

export type I18NObjectValue = {
    value?: { [key: string]: any };
    values: Array<{ locale: string; value: any }>;
};

export type I18NValue<T = any> = {
    value?: T;
    values: Array<{ locale: string; value: T }>;
};

export type I18NListValue<T = any> = {
    value?: T[];
    values: Array<{ locale: string; value: T[] }>;
};
