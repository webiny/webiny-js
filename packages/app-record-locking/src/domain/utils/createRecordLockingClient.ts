import type { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient.js";
import { RecordLockingClient } from "~/domain/RecordLockingClient.js";
import { ApolloClient } from "@apollo/client";

export const createRecordLockingClient = (client: IRecordLockingClient | ApolloClient) => {
    if (client instanceof ApolloClient) {
        return new RecordLockingClient({ client });
    }
    return client;
};
