import { Result } from "@webiny/feature/api";
import { ListNotificationTypesRepository as Repository } from "./abstractions.js";
import { NotificationAdapter } from "../NotificationAdapter/index.js";

class ListNotificationTypesRepositoryImpl implements Repository.Interface {
    private readonly types;

    public constructor(types: NotificationAdapter.Interface[]) {
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
    dependencies: [[NotificationAdapter, { multiple: true }]]
});
