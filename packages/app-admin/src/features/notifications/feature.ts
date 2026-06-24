import { createFeature } from "@webiny/feature/admin";
import { NotificationService } from "./NotificationService.js";
import { NotificationsPresenter } from "./NotificationsPresenter.js";
import {
    NotificationService as NotificationServiceAbstraction,
    NotificationsPresenter as NotificationsPresenterAbstraction
} from "./abstractions.js";

export const NotificationServiceFeature = createFeature({
    name: "NotificationService",
    register(container) {
        container.register(NotificationService).inSingletonScope();
        container.register(NotificationsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            notificationService: container.resolve(NotificationServiceAbstraction),
            presenter: container.resolve(NotificationsPresenterAbstraction)
        };
    }
});
