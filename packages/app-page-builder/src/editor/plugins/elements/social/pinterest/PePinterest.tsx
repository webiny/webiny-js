import React from "react";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { EmbedPluginConfig } from "~/editor/plugins/elements/utils/oembed/createEmbedPlugin";
import PinterestEmbed from "./PinterestEmbed";

interface Props {
    embedPluginConfig: EmbedPluginConfig;
}

export const PePinterest = createRenderer<Props>(({ embedPluginConfig }) => {
    const { getElement } = useRenderer();
    const element = getElement();

    return <PinterestEmbed element={element} {...embedPluginConfig.oembed} />;
});
