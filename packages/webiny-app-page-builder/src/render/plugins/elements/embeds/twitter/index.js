// @flow
import React from "react";
import OEmbed from "webiny-app-page-builder/render/components/OEmbed";
import type { PbRenderElementPluginType } from "webiny-app-page-builder/types";

const oembed = {
    global: "twttr",
    sdk: "https://platform.twitter.com/widgets.js",
    init({ node }) {
        window.twttr.widgets.load(node);
    }
};

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-twitter",
        type: "pb-render-page-element",
        elementType: "twitter",
        render(props) {
            return <OEmbed element={props.element} {...oembed} />;
        }
    };
};
