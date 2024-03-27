import { createGraphQLSchema } from "~/graphql/schema";
import { createContext } from "~/context";

export const createLockingMechanism = () => {
    return [createContext(), createGraphQLSchema()];
};
