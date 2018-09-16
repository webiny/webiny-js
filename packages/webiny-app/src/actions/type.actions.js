// @flow
import { createAction } from "./../redux";
import { graphqlQuery } from ".";
import {
    generateListQuery,
    generateOneQuery,
    generateUpdateQuery,
    generateCreateQuery,
    generateDeleteQuery
} from "./crud";

import _ from "lodash";

const PREFIX = "[CRUD]";

export const TYPE_LIST = `${PREFIX} List`;
export const TYPE_ONE = `${PREFIX} Find`;
export const TYPE_SAVE = `${PREFIX} Save`;
export const TYPE_CREATE = `${PREFIX} Create`;
export const TYPE_UPDATE = `${PREFIX} Update`;
export const TYPE_DELETE = `${PREFIX} Delete`;

const typeList = createAction(TYPE_LIST, {
    middleware({ store, action, next }) {
        next(action);

        const {
            type,
            fields,
            page,
            perPage,
            search,
            sort,
            where,
            onSuccess,
            onError
        } = action.payload;

        const query = generateListQuery({ type, fields });

        store.dispatch(
            graphqlQuery({
                query,
                variables: { page, perPage, sort, where, search },
                onSuccess: response => {
                    const data = _.get(response, ["data", type, "list"].join("."));
                    if (typeof onSuccess === "function") {
                        onSuccess(data);
                    }
                },
                onError: error => {
                    if (typeof onError === "function") {
                        onError({ ...error });
                    }
                }
            })
        );
    }
});

const typeOne = createAction(TYPE_ONE, {
    middleware({ store, action, next }) {
        next(action);

        const { type, fields, variables, onSuccess, onError } = action.payload;
        const query = generateOneQuery({ type, fields });
        store.dispatch(
            graphqlQuery({
                query,
                variables,
                onSuccess: response => {
                    const data = _.get(response, ["data", type, "one"].join("."));
                    if (typeof onSuccess === "function") {
                        onSuccess(data);
                    }
                },
                onError: error => {
                    if (typeof onError === "function") {
                        onError({ ...error });
                    }
                }
            })
        );
    }
});

const typeSave = createAction(TYPE_SAVE, {
    middleware({ store, action, next }) {
        next(action);
        if (action.payload.data.id) {
            store.dispatch(typeUpdate(action.payload));
        } else {
            store.dispatch(typeCreate(action.payload));
        }
    }
});

const typeCreate = createAction(TYPE_CREATE, {
    middleware({ store, action, next }) {
        next(action);
        const { type, fields, onSuccess, onError, data } = action.payload;
        const query = generateCreateQuery({ type, fields });

        store.dispatch(
            graphqlQuery({
                query,
                variables: { data, id: data.id },
                onSuccess: response => {
                    const data = _.get(response, ["data", type, "create"].join("."));
                    if (typeof onSuccess === "function") {
                        onSuccess(data);
                    }
                },
                onError: error => {
                    if (typeof onError === "function") {
                        onError({ ...error });
                    }
                }
            })
        );
    }
});

const typeUpdate = createAction(TYPE_UPDATE, {
    middleware({ store, action, next }) {
        next(action);
        const { type, fields, onSuccess, onError, data } = action.payload;
        const query = generateUpdateQuery({ type, fields });

        store.dispatch(
            graphqlQuery({
                query,
                variables: { data, id: data.id },
                onSuccess: response => {
                    const data = _.get(response, ["data", type, "update"].join("."));
                    if (typeof onSuccess === "function") {
                        onSuccess(data);
                    }
                },
                onError: error => {
                    if (typeof onError === "function") {
                        onError({ ...error });
                    }
                }
            })
        );
    }
});

const typeDelete = createAction(TYPE_DELETE, {
    middleware({ store, action, next }) {
        next(action);
        const { type, fields, onSuccess, onError, id } = action.payload;
        const query = generateDeleteQuery({ type, fields });

        store.dispatch(
            graphqlQuery({
                query,
                variables: { id },
                onSuccess: data => {
                    if (typeof onSuccess === "function") {
                        onSuccess({ ...data.data });
                    }
                },
                onError: error => {
                    if (typeof onError === "function") {
                        onError({ ...error });
                    }
                }
            })
        );
    }
});

export { typeList, typeOne, typeCreate, typeUpdate, typeSave, typeDelete };
