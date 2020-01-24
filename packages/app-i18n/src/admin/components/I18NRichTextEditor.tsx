import React from "react";
import { RichTextEditor, RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { getPlugins } from "@webiny/plugins";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const I18NRichTextEditor = (props: RichTextEditorProps): React.ReactElement => {
    let plugins = React.useMemo(
        () =>
            getPlugins("i18n-input-rich-text-editor").map(
                (plugin: I18NInputRichTextEditorPlugin) => plugin.plugin
            ),
        []
    );

    if (Array.isArray(props.plugins)) {
        plugins = [...plugins, ...props.plugins];
    }

    return <RichTextEditor {...props} plugins={plugins} />;
};

export default I18NRichTextEditor;
