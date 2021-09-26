import React from "react";
import OEmbed from "../~/components/OEmbed";
import { PbRenderElementPlugin } from "../~/types";

const oembed = {
    global: "instgrm",
    sdk: "https://www.instagram.com/embed.js",
    init({ node }) {
        // @ts-ignore
        window.instgrm.Embeds.process(node.firstChild);
    }
};

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-instagram",
        type: "pb-render-page-element",
        elementType: "instagram",
        render(props) {
            return <OEmbed element={props.element} {...oembed} />;
        }
    };
};
