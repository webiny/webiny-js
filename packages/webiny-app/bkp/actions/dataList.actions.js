// @flow
import { createAction, addReducer, addMiddleware } from "./../redux";
import { typeList } from ".";
import type { StatePath } from "webiny-app/types";

const PREFIX = "[LIST]";

export const LIST_SET_LOADING = `${PREFIX} Set Loading`;
export const LIST_LOAD = `${PREFIX} Load`;
export const LIST_REFRESH = `${PREFIX} Refresh`;
export const LIST_LOAD_SUCCESS = `${PREFIX} List Success`;
export const LIST_LOAD_ERROR = `${PREFIX} List Error`;
export const LIST_MULTISELECT = `${PREFIX} Multi Select`;

export const listSlice: StatePath = action => {
    return "lists." + action.payload.name;
};

export const setDataListLoading = createAction(LIST_SET_LOADING);

addReducer([LIST_SET_LOADING], listSlice, (state, action) => {
    return { ...state, loading: action.payload.loading };
});

export const loadDataList = createAction(LIST_LOAD);

addMiddleware([LIST_LOAD], ({ store, action, next }) => {
    next(action);

    const { name, type, fields, page, perPage, sort, search, where } = action.payload;
    store.dispatch(setDataListLoading({ name, loading: true }));

    store.dispatch(
        typeList({
            type,
            fields,
            page,
            perPage,
            sort,
            search,
            where,
            onSuccess: data => {
                store.dispatch(setDataListLoading({ name, loading: false }));
                store.dispatch(
                    loadDataListSuccess({
                        data,
                        params: {
                            type,
                            fields,
                            page,
                            perPage,
                            sort,
                            search,
                            where
                        },
                        name
                    })
                );
            },
            onError: error => {
                store.dispatch(setDataListLoading({ name, loading: false }));
                store.dispatch(loadDataListError({ error, name }));
            }
        })
    );
});

export const loadDataListSuccess = createAction(LIST_LOAD_SUCCESS);

addReducer([LIST_LOAD_SUCCESS], "lists", (state, action) => {
    const { data, params, name } = action.payload;
    return {
        ...state,
        [name]: {
            params,
            data,
            error: null
        }
    };
});

export const loadDataListError = createAction(LIST_LOAD_ERROR);

addReducer([LIST_LOAD_ERROR], "lists", (state, action) => {
    const { error, name } = action.payload;
    return {
        ...state,
        [name]: {
            error,
            data: null
        }
    };
});

export const refreshDataList = createAction(LIST_REFRESH);

addMiddleware([LIST_REFRESH], ({ store, action, next }) => {
    next(action);

    const { name } = action.payload;
    const { lists } = store.getState();
    if (!lists || !lists[name]) {
        return;
    }

    store.dispatch(loadDataList({ name, ...lists[name].params }));
});

export const multiSelect = createAction(LIST_MULTISELECT);

addReducer([LIST_MULTISELECT], listSlice, (state, action) => {
    let { item: items, value } = action.payload;
    if (!Array.isArray(items)) {
        items = [items];
    }

    let multiSelectedItems = [];
    if (Array.isArray(state.multiSelectedItems)) {
        multiSelectedItems = [...state.multiSelectedItems];
    }

    items.forEach(item => {
        if (value === undefined) {
            multiSelectedItems.includes(item)
                ? multiSelectedItems.splice(multiSelectedItems.indexOf(item), 1)
                : multiSelectedItems.push(item);
        } else {
            if (value === true) {
                !multiSelectedItems.includes(item) && multiSelectedItems.push(item);
            } else {
                multiSelectedItems.includes(item) &&
                multiSelectedItems.splice(multiSelectedItems.indexOf(item), 1);
            }
        }
    });

    return { ...state, multiSelectedItems };
});
