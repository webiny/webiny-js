import { Topic } from "@webiny/pubsub/types";
import { BeforeGroupUpdateTopicParams } from "~/types";
import { CmsGroupPlugin } from "~/content/plugins/CmsGroupPlugin";
import { PluginsContainer } from "@webiny/plugins";

export interface Params {
    onBeforeUpdate: Topic<BeforeGroupUpdateTopicParams>;
    plugins: PluginsContainer;
}
export const assignBeforeGroupUpdate = (params: Params) => {
    const { onBeforeUpdate, plugins } = params;

    onBeforeUpdate.subscribe(({ group }) => {
        const groupPlugin: CmsGroupPlugin = plugins
            .byType<CmsGroupPlugin>(CmsGroupPlugin.type)
            .find((item: CmsGroupPlugin) => item.contentModelGroup.slug === group.slug);
        if (!groupPlugin) {
            return;
        }
        throw new Error(`Cms Groups defined via plugins cannot be updated.`);
    });
};
