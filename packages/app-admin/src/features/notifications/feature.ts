import { createFeature } from "@webiny/feature/admin";
import { Notifications } from "./Notifications.js";
import { NotificationsPresenter } from "./NotificationsPresenter.js";
import {
    Notifications as NotificationsAbstraction,
    NotificationsPresenter as NotificationsPresenterAbstraction
} from "./abstractions.js";

export const NotificationsFeature = createFeature({
    name: "Notifications",
    register(container) {
        container.register(Notifications).inSingletonScope();
        container.register(NotificationsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            notifications: container.resolve(NotificationsAbstraction),
            presenter: container.resolve(NotificationsPresenterAbstraction)
        };
    }
});
