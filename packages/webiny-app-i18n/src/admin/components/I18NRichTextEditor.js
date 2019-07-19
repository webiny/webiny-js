// @flow
import React from "react";
import { RichTextEditor, type RichTextEditorPropsType } from "webiny-ui/RichTextEditor";
import { getPlugins } from "webiny-plugins";

const I18NRichTextEditor = (props: RichTextEditorPropsType) => {
    // $FlowFixMe
    let plugins = React.useMemo(
        () => getPlugins("i18n-input-rich-text-editor").map(plugin => plugin.plugin),
        []
    );

    if (Array.isArray(props.plugins)) {
        plugins = [...plugins, ...props.plugins];
    }

    return <RichTextEditor {...props} plugins={plugins} />;
};

export default I18NRichTextEditor;
