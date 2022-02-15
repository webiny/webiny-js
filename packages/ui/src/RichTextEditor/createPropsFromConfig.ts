import { RichTextEditorProps } from "./RichTextEditor";
import { ToolSettings } from "@editorjs/editorjs";
import { OutputData } from "@editorjs/editorjs/types";

interface CreatePropsFromConfigResult {
    onReady: (editor: any) => void;
    tools: {
        [key: string]: ToolSettings;
    };
}

interface OnReadyParams {
    editor: any;
    initialData: OutputData;
}
/**
 * Creates RichTextEditor props from the given config (or array of configs).
 *
 * TODO: figure out types for editor and return type of the function.
 */
export const createPropsFromConfig = (
    config: RichTextEditorProps[]
): CreatePropsFromConfigResult => {
    const configs = (Array.isArray(config) ? config : [config]) as RichTextEditorProps[];

    return {
        onReady(params: OnReadyParams) {
            configs.forEach(config => {
                if (typeof config.onReady === "function") {
                    config.onReady(params);
                }
            });
        },
        tools: configs.reduce((tools, config) => {
            return {
                ...tools,
                ...config.tools
            };
        }, {} as Record<string, ToolSettings>)
    };
};
