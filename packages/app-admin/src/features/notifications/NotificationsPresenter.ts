import { makeAutoObservable, computed } from "mobx";
import {
    Notifications,
    NotificationsPresenter as Abstraction,
    type INotificationsViewModel
} from "./abstractions.js";

class NotificationsPresenterImpl implements Abstraction.Interface {
    constructor(private service: Notifications.Interface) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): INotificationsViewModel {
        return {
            notifications: this.service.getNotifications()
        };
    }

    markShown(id: string): void {
        this.service.remove(id);
    }
}

export const NotificationsPresenter = Abstraction.createImplementation({
    implementation: NotificationsPresenterImpl,
    dependencies: [Notifications]
});
