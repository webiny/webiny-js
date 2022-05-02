import { ElasticsearchIndexPlugin } from "~/plugins/definition/ElasticsearchIndexPlugin";
import { PluginsContainer } from "@webiny/plugins";

interface ListIndicesPlugins {
    container: PluginsContainer;
    type: string;
    locale: string;
}
export const listIndicesPlugins = <T extends ElasticsearchIndexPlugin>({
    container,
    type,
    locale
}: ListIndicesPlugins): T[] => {
    return container.byType<T>(type).filter(plugin => {
        return plugin.canUse(locale);
    });
};
