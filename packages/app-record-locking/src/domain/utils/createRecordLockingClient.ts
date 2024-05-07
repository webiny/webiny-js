import { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient";
import { RecordLockingClient } from "~/domain/RecordLockingClient";
import { ApolloClient } from "apollo-client";

export const createRecordLockingClient = (client: IRecordLockingClient | ApolloClient<any>) => {
    if (client instanceof ApolloClient) {
        return new RecordLockingClient({ client });
    }
    return client;
};
