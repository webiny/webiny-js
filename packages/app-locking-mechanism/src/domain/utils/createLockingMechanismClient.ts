import { ILockingMechanismClient } from "~/domain/abstractions/ILockingMechanismClient";
import { LockingMechanismClient } from "~/domain/LockingMechanismClient";
import { ApolloClient } from "apollo-client";

export const createLockingMechanismClient = (
    client: ILockingMechanismClient | ApolloClient<any>
) => {
    if (client instanceof ApolloClient) {
        return new LockingMechanismClient({ client });
    }
    return client;
};
