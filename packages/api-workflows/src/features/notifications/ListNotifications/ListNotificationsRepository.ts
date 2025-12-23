import { Result } from "@webiny/feature/api";
import { ListNotificationsRepository as Repository, NotificationType } from "./abstractions.js";

class ListNotificationsRepositoryImpl implements Repository.Interface {
    public constructor(private notificationTypes: NotificationType.Interface[]) {}

    public async execute(): Repository.Return {
        return Result.ok(this.notificationTypes);
    }
}

export const ListNotificationsRepository = Repository.createImplementation({
    implementation: ListNotificationsRepositoryImpl,
    dependencies: [[NotificationType, { multiple: true }]]
});
