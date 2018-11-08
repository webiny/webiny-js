// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";

const oembed = {
    global: "instgrm",
    sdk: "https://www.instagram.com/embed.js",
    init({ node }) {
        window.instgrm.Embeds.process(node.firstChild);
    }
};

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-instagram",
        type: "cms-render-element",
        element: "cms-element-instagram",
        render(props) {
            return <OEmbed element={props.element} {...oembed} />;
        }
    };
};
