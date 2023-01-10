import React from "react";

import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import PeOEmbed from "~/editor/components/PeOEmbed";
import { EmbedPluginConfig } from "~/editor/plugins/elements/utils/oembed/createEmbedPlugin";
import VimeoEmbed from "./VimeoEmbed";

interface Props {
    embedPluginConfig: EmbedPluginConfig;
}

export const PeVimeo = createRenderer<Props>(({ embedPluginConfig }) => {
    const { getElement } = useRenderer();
    const element = getElement();

    return (
        <PeOEmbed
            element={element}
            {...embedPluginConfig.oembed}
            renderEmbed={props => <VimeoEmbed {...props} />}
        />
    );
});
