import ApolloClient from "apollo-client";

export type SaveRevisionActionArgsType = {
    client: ApolloClient<any>;
    onFinish?: () => void;
};
