import React from "react";

import { OEmbed, OEmbedProps } from "./components/OEmbed";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

const oembed: Partial<OEmbedProps> = {
    global: "twttr",
    sdk: "https://platform.twitter.com/widgets.js",
    init({ node }) {
        // @ts-ignore
        window.twttr.widgets.load(node);
    }
};

export const createTwitter = () => {
    return createRenderer(() => {
        const { getAttributes, getElement } = useRenderer();
        return (
            <div {...getAttributes()}>
                <OEmbed element={getElement()} {...oembed} />
            </div>
        );
    });
};
