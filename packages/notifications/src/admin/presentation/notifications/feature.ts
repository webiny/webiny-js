import { createFeature } from "@webiny/feature/admin";
import { NotificationsPresenter as PresenterAbstraction } from "./abstractions.js";
import { NotificationsPresenter } from "./NotificationsPresenter.js";

export const NotificationsPresenterFeature = createFeature({
    name: "Notifications/Presenter",
    register(container) {
        container.register(NotificationsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
