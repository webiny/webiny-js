// @flow
import React from "react";
import OEmbed from "@webiny/app-page-builder/render/components/OEmbed";
import type { PbRenderElementPluginType } from "@webiny/app-page-builder/types";

const oembed = {
    global: "instgrm",
    sdk: "https://www.instagram.com/embed.js",
    init({ node }) {
        window.instgrm.Embeds.process(node.firstChild);
    }
};

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-instagram",
        type: "pb-render-page-element",
        elementType: "instagram",
        render(props) {
            return <OEmbed element={props.element} {...oembed} />;
        }
    };
};
