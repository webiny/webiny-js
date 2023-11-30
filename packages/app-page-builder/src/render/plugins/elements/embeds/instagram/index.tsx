import React from "react";
import { OEmbed, OEmbedProps } from "~/render/components/OEmbed";
import { PbRenderElementPlugin } from "~/types";

const oembed: Partial<OEmbedProps> = {
    global: "instgrm",
    sdk: "https://www.instagram.com/embed.js",
    init({ node }) {
        // TODO @ts-refactor any way to use key on window?
        // @ts-expect-error
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
