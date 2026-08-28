import { ContextPlugin, createRegisterExtensionPlugin } from "@webiny/handler";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { NOTIFICATION_MODEL_ID } from "./constants.js";
import { NotificationModel as NotificationPrivateModel } from "./domain/notification/notificationModel.js";
import { NotificationModel } from "./domain/notification/abstractions.js";
import { NotificationMapper } from "./domain/notification/NotificationMapper.js";
import { NotificationRepository } from "./domain/notification/NotificationRepository.js";
import { CreateNotificationFeature } from "./features/CreateNotification/feature.js";
import { ListNotificationsFeature } from "./features/ListNotifications/feature.js";
import { NotificationCountsFeature } from "./features/NotificationCounts/feature.js";
import { MarkNotificationsFeature } from "./features/MarkNotifications/feature.js";
import { ArchiveNotificationsFeature } from "./features/ArchiveNotifications/feature.js";
import { NotificationsSchema } from "./graphql/notifications.js";

export const createNotifications = () => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(NotificationPrivateModel);
    });

    const notificationsContextPlugin = new ContextPlugin(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const identityContext = context.container.resolve(IdentityContext);

        if (!tenantContext.getTenant()) {
            return;
        }

        context.container.register(NotificationPrivateModel);

        const getModel = context.container.resolve(GetModelUseCase);

        await identityContext.withoutAuthorization(async () => {
            const model = await getModel.execute(NOTIFICATION_MODEL_ID);
            context.container.registerInstance(NotificationModel, model.value);
        });

        context.container.register(NotificationMapper);
        context.container.register(NotificationRepository).inSingletonScope();

        CreateNotificationFeature.register(context.container);
        ListNotificationsFeature.register(context.container);
        NotificationCountsFeature.register(context.container);
        MarkNotificationsFeature.register(context.container);
        ArchiveNotificationsFeature.register(context.container);

        context.container.register(NotificationsSchema);
    });

    notificationsContextPlugin.name = "notifications.context";

    return [notificationsContextPlugin, modelsPlugin];
};
