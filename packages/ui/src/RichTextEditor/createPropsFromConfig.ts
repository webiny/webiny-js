import { RichTextEditorProps } from "./RichTextEditor";

/**
 * Creates RichTextEditor props from the given config (or array of configs).
 */
export const createPropsFromConfig = (config): Partial<RichTextEditorProps> => {
    const configs = Array.isArray(config) ? config : [config];

    return {
        onReady(editor) {
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
