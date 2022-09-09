import { Topic } from "@webiny/pubsub/types";
import { BeforeGroupUpdateTopicParams } from "~/types";
import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin";
import { PluginsContainer } from "@webiny/plugins";

interface AssignBeforeGroupUpdateParams {
    onGroupBeforeUpdate: Topic<BeforeGroupUpdateTopicParams>;
    plugins: PluginsContainer;
}
export const assignBeforeGroupUpdate = (params: AssignBeforeGroupUpdateParams) => {
    const { onGroupBeforeUpdate, plugins } = params;

    onGroupBeforeUpdate.subscribe(({ group }) => {
        const groupPlugin = plugins
            .byType<CmsGroupPlugin>(CmsGroupPlugin.type)
            .find(item => item.contentModelGroup.slug === group.slug);
        if (!groupPlugin) {
            return;
        }
        throw new Error(`Cms Groups defined via plugins cannot be updated.`);
    });
};
