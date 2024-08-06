import { ApwContentTypes, ApwContext } from "~/types";
import { ApwChangeRequestNotification } from "~/ApwChangeRequestNotification";

interface GetLastChangeRequestNotificationPluginParams {
    context: ApwContext;
    type: ApwContentTypes;
}
interface GetLastChangeRequestNotificationPlugin {
    (
        params: GetLastChangeRequestNotificationPluginParams
    ): ApwChangeRequestNotification | undefined;
}
export const getLastChangeRequestNotificationPlugin: GetLastChangeRequestNotificationPlugin =
    params => {
        const { context, type } = params;
        /**
         * We need the plugin to create the notification text.
         */
        const plugins = context.plugins
            .byType<ApwChangeRequestNotification>(ApwChangeRequestNotification.type)
            .filter(plugin => {
                return plugin.canUse(type);
            });

        return plugins.shift();
    };
