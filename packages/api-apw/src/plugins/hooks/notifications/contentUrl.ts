import { PluginsContainer } from "@webiny/plugins";
import { ApwContentUrlPlugin, ApwContentUrlPluginCbParams } from "~/ApwContentUrlPlugin";

interface Params extends ApwContentUrlPluginCbParams {
    plugins: PluginsContainer;
}

export const createContentUrl = (params: Params): string | null => {
    const { plugins, contentReview } = params;

    const { type: contentType } = contentReview.content;

    const [contentUrlPlugin] = plugins
        .byType<ApwContentUrlPlugin>(ApwContentUrlPlugin.type)
        .filter(plugin => {
            return plugin.canUse(contentType);
        })
        .reverse();
    if (!contentUrlPlugin) {
        return null;
    }

    return contentUrlPlugin.create(params);
};
