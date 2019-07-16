import React from "react";
import { RichTextEditor } from "webiny-ui/RichTextEditor";
import { getPlugins } from "webiny-plugins";

const I18NRichTextEditor = props => {
    let menuPlugins = React.useMemo(() => {
        return getPlugins("i18n-rich-editor-menu-item");
    }, []);

    let editorPlugins = React.useMemo(
        () => getPlugins("i18n-rich-editor").map(item => item.slate),
        []
    );

    if (Array.isArray(props.plugins)) {
        editorPlugins = [...editorPlugins, ...props.plugins];
    }

    if (Array.isArray(props.menu)) {
        menuPlugins = [...menuPlugins, ...props.menu];
    }

    return <RichTextEditor {...props} editorPlugins={editorPlugins} menuPlugins={menuPlugins} />;
};

export default I18NRichTextEditor;
