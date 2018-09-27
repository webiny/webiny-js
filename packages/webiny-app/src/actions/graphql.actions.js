// @flow
import { createAction, addReducer, addMiddleware } from "./../redux";
import { app } from "webiny-app";
import GraphQLError from "./../graphql/Error";

const generateApi = (promise, dataKey) => {
    return promise
        .then(({ data }) => {
            console.log(data);
            return data[dataKey];
        })
        .catch(error => {
            throw GraphQLError.from(error);
        });
};

const PREFIX = "[GRAPHQL]";

export const GRAPHQL_MUTATION = `${PREFIX} Mutation`;
export const GRAPHQL_QUERY = `${PREFIX} Query`;
export const GRAPHQL_START = `${PREFIX} Start`;
export const GRAPHQL_FINISH = `${PREFIX} Finish`;
export const GRAPHQL_SUCCESS = `${PREFIX} Success`;
export const GRAPHQL_ERROR = `${PREFIX} Error`;

export const graphqlSuccess = createAction(GRAPHQL_SUCCESS);
export const graphqlError = createAction(GRAPHQL_ERROR);

export const graphqlStart = createAction(GRAPHQL_START);

addReducer([GRAPHQL_START], "graphql.activeOperationsCount", (state = 0) => {
    return Number(state) + 1;
});

export const graphqlFinish = createAction(GRAPHQL_FINISH);

addReducer([GRAPHQL_FINISH], "graphql.activeOperationsCount", (state = 0) => {
    return Number(state) - 1;
});

export const graphqlQuery = createAction(GRAPHQL_QUERY);

addMiddleware([GRAPHQL_QUERY], async ({ store, action, next }) => {
    next(action);

    store.dispatch(graphqlStart());
    const { query, variables, onSuccess } = action.payload;
    const response = await app.graphql.query({ query, variables });

    store.dispatch(graphqlFinish());
    store.dispatch(graphqlSuccess(response));
    if (onSuccess) {
        onSuccess(response);
    }
});

export const graphqlMutation = createAction(GRAPHQL_MUTATION);

addMiddleware([GRAPHQL_MUTATION], ({ store, action, next }) => {
    next(action);

    store.dispatch(graphqlStart());
    const { mutation, variables, methodName, onSuccess, onError } = action.payload;
    generateApi(app.graphql.mutate({ mutation, variables }), methodName)
        .then(data => {
            store.dispatch(graphqlFinish());
            store.dispatch(graphqlSuccess(data));
            if (onSuccess) {
                onSuccess({ data });
            }
        })
        .catch(error => {
            store.dispatch(graphqlFinish());
            store.dispatch(graphqlError(error));
            if (onError) {
                onError({ error });
            }
        });
});
