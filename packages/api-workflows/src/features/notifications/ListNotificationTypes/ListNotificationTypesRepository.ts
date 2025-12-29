import { Result } from "@webiny/feature/api";
import { ListNotificationTypesRepository as Repository } from "./abstractions.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

class ListNotificationTypesRepositoryImpl implements Repository.Interface {
    private readonly types;

    public constructor(types: NotificationTransport.Interface[]) {
        this.types = types;
    }

    public async execute(): Repository.Return {
        return Result.ok(
            this.types.map(type => {
                return {
                    id: type.id,
                    title: type.title
                };
            })
        );
    }
}

export const ListNotificationTypesRepository = Repository.createImplementation({
    implementation: ListNotificationTypesRepositoryImpl,
    dependencies: [[NotificationTransport, { multiple: true }]]
});
