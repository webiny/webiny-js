import { makeAutoObservable, computed } from "mobx";
import {
    NotificationService,
    NotificationsPresenter as Abstraction,
    type INotificationsViewModel
} from "./abstractions.js";

class NotificationsPresenterImpl implements Abstraction.Interface {
    constructor(private service: NotificationService.Interface) {
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
    dependencies: [NotificationService]
});
