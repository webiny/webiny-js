// @flow
import { createAction, addMiddleware } from "./../redux";
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

const typeList = createAction(TYPE_LIST);
addMiddleware([TYPE_LIST], ({ store, action, next }) => {
    next(action);

    const { type, fields, page, perPage, search, sort, where, onSuccess, onError } = action.payload;

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
});

const typeOne = createAction(TYPE_ONE);
addMiddleware([TYPE_ONE], ({ store, action, next }) => {
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
});

export type TypeSave = (payload: {
    type: string,
    fields: string,
    data: Object,
    onSuccess?: Function,
    onError?: Function,
}) => Object;

const typeSave: TypeSave = createAction(TYPE_SAVE);

addMiddleware([TYPE_SAVE], ({ store, action, next }) => {
    next(action);
    if (action.payload.data.id) {
        store.dispatch(typeUpdate(action.payload));
    } else {
        store.dispatch(typeCreate(action.payload));
    }
});

export type TypeCreate = TypeSave;

const typeCreate: TypeCreate = createAction(TYPE_CREATE);
addMiddleware([TYPE_CREATE], ({ store, action, next }) => {
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
});

export type TypeUpdate = TypeSave;

const typeUpdate: TypeUpdate = createAction(TYPE_UPDATE);
addMiddleware([TYPE_UPDATE], ({ store, action, next }) => {
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
});

const typeDelete = createAction(TYPE_DELETE);
addMiddleware([TYPE_DELETE], ({ store, action, next }) => {
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
});

export { typeList, typeOne, typeCreate, typeUpdate, typeSave, typeDelete };
