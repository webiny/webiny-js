import { app } from "webiny-app";
import gql from "graphql-tag";
import _ from "lodash";
import pluralize from "pluralize";
import GraphQLError from "./Error";

const createApi = (promise, dataKey) => {
    return promise
        .then(({ data }) => {
            return { data: data[dataKey] };
        })
        .catch(error => {
            const { message, code, data } = error.graphQLErrors[0];
            throw new GraphQLError(message, code, data, error);
        });
};

const createListQuery = (entity, fields) => ({ fields: newFields, variables }) => {
    const methodName = "list" + pluralize.plural(entity);
    const query = gql`
        query ${_.upperFirst(
            methodName
        )}($filter: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
            ${methodName}(filter: $filter, sort: $sort, page: $page, perPage: $perPage, search: $search) {
                list {
                    ${newFields || fields}
                }
                meta {
                    count
                    totalCount
                    totalPages
                }
            }
        }
    `;

    return createApi(app.graphql.query({ query, variables }), methodName);
};

const createGetQuery = (entity, fields) => ({ fields: newFields, variables }) => {
    const methodName = "get" + entity;
    const query = gql`
        query ${_.upperFirst(methodName)}($id: String!) {
            ${methodName}(id: $id) {
                ${newFields || fields}
            }
        }
    `;

    return createApi(app.graphql.query({ query, variables }), methodName);
};

const createCreateQuery = (entity, fields) => ({ fields: newFields, variables }) => {
    const methodName = "create" + entity;
    const mutation = gql`
        mutation ${_.upperFirst(methodName)}($data: JSON!) {
            ${methodName}(data: $data) {
                ${newFields || fields}
            }
        }
    `;

    return createApi(app.graphql.mutate({ mutation, variables }), methodName);
};

const createUpdateQuery = (entity, fields) => ({ fields: newFields, variables }) => {
    const methodName = "update" + entity;
    const mutation = gql`
        mutation ${_.upperFirst(methodName)}($id: String!, $data: JSON!) {
            ${methodName}(id: $id, data: $data) {
                ${newFields || fields}
            }
        }
    `;

    return createApi(app.graphql.mutate({ mutation, variables }), methodName);
};

const createDeleteQuery = entity => ({ variables }) => {
    const methodName = "update" + entity;
    const mutation = gql`
        mutation ${_.upperFirst(methodName)}($id: String!) {
            deleteSecurityUser(id: $id)
        }
    `;

    return createApi(app.graphql.mutate({ mutation, variables }), methodName);
};

export default {
    createGetQuery,
    createListQuery,
    createCreateQuery,
    createUpdateQuery,
    createDeleteQuery
};
