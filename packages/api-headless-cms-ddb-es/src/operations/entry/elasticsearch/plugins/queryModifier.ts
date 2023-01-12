import { CmsEntryElasticsearchQueryModifierPlugin } from "~/plugins";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";

interface Params {
    plugins: PluginsContainer;
    model: CmsModel;
}
export const createQueryModifierPluginList = ({ plugins, model }: Params) => {
    return plugins
        .byType<CmsEntryElasticsearchQueryModifierPlugin>(
            CmsEntryElasticsearchQueryModifierPlugin.type
        )
        .filter(pl => {
            return !pl.modelId || pl.modelId === model.modelId;
        });
};
