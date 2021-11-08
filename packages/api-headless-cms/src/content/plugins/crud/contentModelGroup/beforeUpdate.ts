import { Topic } from "@webiny/pubsub/types";
import { BeforeGroupUpdateTopic } from "~/types";
import { ContentModelGroupPlugin } from "~/content/plugins/ContentModelGroupPlugin";
import { PluginsContainer } from "@webiny/plugins";

export interface Params {
    onBeforeUpdate: Topic<BeforeGroupUpdateTopic>;
    plugins: PluginsContainer;
}
export const assignBeforeGroupUpdate = (params: Params) => {
    const { onBeforeUpdate, plugins } = params;

    onBeforeUpdate.subscribe(({ group }) => {
        const groupPlugin: ContentModelGroupPlugin = plugins
            .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
            .find((item: ContentModelGroupPlugin) => item.contentModelGroup.slug === group.slug);
        if (!groupPlugin) {
            return;
        }
        throw new Error(`Content model groups defined via plugins cannot be updated.`);
    });
};
