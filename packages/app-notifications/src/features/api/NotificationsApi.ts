import { NotificationsApi as ApiAbstraction, NotificationsGateway } from "./abstractions.js";
import type { IListNotificationsParams } from "./abstractions.js";

class NotificationsApiImpl implements ApiAbstraction.Interface {
    constructor(private gateway: NotificationsGateway.Interface) {}

    list(params: IListNotificationsParams) {
        return this.gateway.list(params);
    }
    counts() {
        return this.gateway.counts();
    }
    markRead(id: string) {
        return this.gateway.markRead(id);
    }
    markAllRead() {
        return this.gateway.markAllRead();
    }
    archive(id: string) {
        return this.gateway.archive(id);
    }
    unarchive(id: string) {
        return this.gateway.unarchive(id);
    }
}

export const NotificationsApi = ApiAbstraction.createImplementation({
    implementation: NotificationsApiImpl,
    dependencies: [NotificationsGateway]
});
