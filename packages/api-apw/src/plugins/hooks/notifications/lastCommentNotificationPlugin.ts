import { ApwContentTypes, ApwContext } from "~/types";
import { ApwCommentNotification } from "~/ApwCommentNotification";

interface GetLastCommentNotificationPluginParams {
    context: ApwContext;
    type: ApwContentTypes;
}
interface GetLastCommentNotificationPlugin {
    (params: GetLastCommentNotificationPluginParams): ApwCommentNotification | undefined;
}
export const getLastCommentNotificationPlugin: GetLastCommentNotificationPlugin = params => {
    const { context, type } = params;
    /**
     * We need the plugin to create the notification text.
     */
    const plugins = context.plugins
        .byType<ApwCommentNotification>(ApwCommentNotification.type)
        .filter(plugin => {
            return plugin.canUse(type);
        });

    return plugins.shift();
};
