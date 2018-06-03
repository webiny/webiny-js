import React from "react";
import { Component } from "webiny-app";
import { Widget } from "webiny-app-cms";

const TextComponent = Component({ modules: ["SlateEditor"] })(
    ({ text, modules: { SlateEditor } }) => <SlateEditor value={text} />
);

/**
 * Text widget plugin.
 */
class Text extends Widget {
    render({ widget: { data } }) {
        return <TextComponent text={data.text} />;
    }
}

export default Text;
