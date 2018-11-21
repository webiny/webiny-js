// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";

const oembed = {
    global: "twttr",
    sdk: "https://platform.twitter.com/widgets.js",
    init({ node }) {
        window.twttr.widgets.load(node);
    }
};

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-twitter",
        type: "cms-render-element",
        element: "cms-element-twitter",
        render(props) {
            return <OEmbed element={props.element} {...oembed} />;
        }
    };
};
