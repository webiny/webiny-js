import { ApolloLink } from "apollo-link";

function omitTypename(key, value) {
    return key === "__typename" ? undefined : value;
}

export default () => {
    return new ApolloLink((operation, forward) => {
        if (operation.variables) {
            operation.variables = JSON.parse(JSON.stringify(operation.variables), omitTypename);
        }
        return forward(operation);
    });
};
