import React from "react";

import { OEmbed, OEmbedProps } from "./components/OEmbed";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

const oembed: Partial<OEmbedProps> = {
    global: "twttr",
    sdk: "https://platform.twitter.com/widgets.js",
    init({ node }) {
        // @ts-expect-error
        window.twttr.widgets.load(node);
    }
};

export const createTwitter = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        return <OEmbed element={getElement()} {...oembed} />;
    });
};
