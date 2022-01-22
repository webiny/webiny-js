import { RichTextEditorProps } from "./RichTextEditor";

/**
 * Creates RichTextEditor props from the given config (or array of configs).
 *
 * TODO: figure out types for editor and return type of the function.
 */
export const createPropsFromConfig = (config: RichTextEditorProps[]) => {
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
            return Object.assign(tools, config.tools);
        }, {})
    };
};
