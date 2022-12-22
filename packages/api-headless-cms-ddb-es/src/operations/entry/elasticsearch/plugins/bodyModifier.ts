import { CmsEntryElasticsearchBodyModifierPlugin } from "~/plugins";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";

interface Params {
    plugins: PluginsContainer;
    model: CmsModel;
}
export const createBodyModifierPluginList = ({ plugins, model }: Params) => {
    return plugins
        .byType<CmsEntryElasticsearchBodyModifierPlugin>(
            CmsEntryElasticsearchBodyModifierPlugin.type
        )
        .filter(pl => {
            return !pl.modelId || pl.modelId === model.modelId;
        });
};
