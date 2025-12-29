import { Result } from "@webiny/feature/api";
import { ListNotificationTypesRepository as Repository } from "./abstractions.js";
import { NotificationType } from "~/domain/notifications/abstractions.js";

class ListNotificationTypesRepositoryImpl implements Repository.Interface {
    private readonly types;

    public constructor(types: NotificationType.Interface[]) {
        this.types = types;
    }

    public async execute(): Repository.Return {
        return Result.ok(this.types);
    }
}

export const ListNotificationTypesRepository = Repository.createImplementation({
    implementation: ListNotificationTypesRepositoryImpl,
    dependencies: [[NotificationType, { multiple: true }]]
});
