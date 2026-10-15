import { Result } from "@webiny/feature/api";
import { ListNotificationTransportsRepository as Repository } from "./abstractions.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

class ListNotificationTransportsRepositoryImpl implements Repository.Interface {
    private readonly transports;

    public constructor(transports: NotificationTransport.Interface[]) {
        this.transports = transports;
    }

    public async execute(): Repository.Return {
        return Result.ok(
            this.transports.map(transport => {
                return {
                    id: transport.id,
                    title: transport.title,
                    description: transport.description ?? null
                };
            })
        );
    }
}

export const ListNotificationTransportsRepository = Repository.createImplementation({
    implementation: ListNotificationTransportsRepositoryImpl,
    dependencies: [[NotificationTransport, { multiple: true }]]
});
