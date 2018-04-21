import { app } from "webiny-app";
import gql from "graphql-tag";
import _ from "lodash";
import pluralize from "pluralize";
import GraphQLError from "./Error";

const generateApi = (promise, dataKey) => {
    return promise
        .then(({ data }) => {
            return { data: data[dataKey] };
        })
        .catch(error => {
            throw GraphQLError.from(error);
        });
};

const generateList = (entity, fields) => ({ fields: newFields, variables }) => {
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

    return generateApi(app.graphql.query({ query, variables }), methodName);
};

const generateGet = (entity, fields) => ({ fields: newFields, variables }) => {
    const methodName = "get" + entity;
    const query = gql`
        query ${_.upperFirst(methodName)}($id: String!) {
            ${methodName}(id: $id) {
                ${newFields || fields}
            }
        }
    `;

    return generateApi(app.graphql.query({ query, variables }), methodName);
};

const generateCreate = (entity, fields) => ({ fields: newFields, variables }) => {
    const methodName = "create" + entity;
    const mutation = gql`
        mutation ${_.upperFirst(methodName)}($data: JSON!) {
            ${methodName}(data: $data) {
                ${newFields || fields}
            }
        }
    `;

    return generateApi(app.graphql.mutate({ mutation, variables }), methodName);
};

const generateUpdate = (entity, fields) => ({ fields: newFields, variables }) => {
    const methodName = "update" + entity;
    const mutation = gql`
        mutation ${_.upperFirst(methodName)}($id: String!, $data: JSON!) {
            ${methodName}(id: $id, data: $data) {
                ${newFields || fields}
            }
        }
    `;

    return generateApi(app.graphql.mutate({ mutation, variables }), methodName);
};

const generateDelete = entity => ({ variables }) => {
    const methodName = "delete" + entity;
    const mutation = gql`
        mutation ${_.upperFirst(methodName)}($id: String!) {
            ${methodName}(id: $id)
        }
    `;

    return generateApi(app.graphql.mutate({ mutation, variables }), methodName);
};

export default {
    generateGet,
    generateList,
    generateCreate,
    generateUpdate,
    generateDelete
};
