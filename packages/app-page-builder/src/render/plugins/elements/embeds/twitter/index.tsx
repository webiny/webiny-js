import React from "react";
import OEmbed from "@webiny/app-page-builder/render/components/OEmbed";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

const oembed = {
    global: "twttr",
    sdk: "https://platform.twitter.com/widgets.js",
    init({ node }) {
        // @ts-ignore
        window.twttr.widgets.load(node);
    }
};

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-twitter",
        type: "pb-render-page-element",
        elementType: "twitter",
        render(props) {
            return <OEmbed element={props.element} {...oembed} />;
        }
    };
};
