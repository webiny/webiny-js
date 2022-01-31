import { RichTextEditorProps } from "./RichTextEditor";
import { ToolSettings } from "@editorjs/editorjs";

interface CreatePropsFromConfigResult {
    onReady: (editor: any) => void;
    tools: {
        [key: string]: ToolSettings;
    };
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
        onReady(editor: any) {
            configs.forEach(config => {
                if (typeof config.onReady === "function") {
                    config.onReady(editor);
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
