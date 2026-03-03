import type { ApolloClient as IApolloClient } from "@apollo/client";
import { createAbstraction } from "@webiny/feature/admin";

export const ApolloClient = createAbstraction<IApolloClient>("ApolloClient");

export namespace ApolloClient {
    export type Interface = IApolloClient;
}
