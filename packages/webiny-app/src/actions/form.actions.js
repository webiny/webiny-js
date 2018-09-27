// @flow
import { createAction, addReducer, addMiddleware } from "./../redux";
import { typeOne, typeSave } from ".";
import type { StatePath } from "webiny-app/types";

const PREFIX = "[FORM]";

export const FORM_SET_LOADING = `${PREFIX} Set Loading`;
export const FORM_RESET = `${PREFIX} Reset`;
export const FORM_EMPTY = `${PREFIX} Empty`;
export const FORM_LOAD = `${PREFIX} Load`;
export const FORM_EMPTY_DATA = `${PREFIX} Empty Data`;
export const FORM_SET_DATA = `${PREFIX} Set Data`;
export const FORM_LOAD_SUCCESS = `${PREFIX} Form Load Success`;
export const FORM_LOAD_ERROR = `${PREFIX} Form Load Error`;
export const FORM_SUBMIT = `${PREFIX} Submit`;
export const FORM_SUBMIT_SUCCESS = `${PREFIX} Form Submit Success`;
export const FORM_SUBMIT_ERROR = `${PREFIX} Form Submit Error`;

export const formSlice: StatePath = (action): string => {
    return "forms." + action.payload.name;
};

export const setFormLoading = createAction(FORM_SET_LOADING);

addReducer([FORM_SET_LOADING], formSlice, (state = {}, action) => {
    const { loading } = action.payload;
    state.loading = loading;
    return state;
});

/**
 * Ideally this would just set the initial state of the form. That means, if a record was loaded (eg. "policies/{id}"),
 * hitting reset would just revert any changes. Otherwise, all data would be emptied.
 */
export const resetForm = createAction(FORM_RESET);
export const emptyForm = createAction(FORM_EMPTY);

addReducer([FORM_RESET, FORM_EMPTY], formSlice, () => {
    return {};
});

export const loadForm = createAction(FORM_LOAD);

addMiddleware([FORM_LOAD], ({ store, action, next }) => {
    next(action);
    const { name, type, fields, id, onSuccess, onError } = action.payload;
    store.dispatch(setFormLoading({ name, loading: true }));

    store.dispatch(
        typeOne({
            type,
            fields,
            variables: { name, type, fields, id },
            onSuccess: data => {
                store.dispatch(setFormLoading({ name, loading: false }));
                store.dispatch(loadFormSuccess({ data, name }));
                typeof onSuccess === "function" && onSuccess({ data, name });
            },
            onError: error => {
                store.dispatch(setFormLoading({ name, loading: false }));
                store.dispatch(loadFormError({ error, name }));
                typeof onError === "function" && onError({ error, name });
            }
        })
    );
});

export const emptyFormData = createAction(FORM_EMPTY_DATA);

addReducer([FORM_EMPTY_DATA], formSlice, state => {
    return { ...state, data: null };
});

export const setFormData = createAction(FORM_SET_DATA);

addReducer([FORM_SET_DATA], formSlice, (state, action) => {
    return { ...state, data: action.payload.data };
});

export const loadFormSuccess = createAction(FORM_LOAD_SUCCESS);

addReducer([FORM_LOAD_SUCCESS], formSlice, (state, action) => {
    const { data } = action.payload;
    return {
        data,
        error: null
    };
});

export const loadFormError = createAction(FORM_LOAD_ERROR);

addReducer([FORM_LOAD_ERROR], formSlice, (state, action) => {
    const { error } = action.payload;
    return {
        data: null,
        error
    };
});

export const submitForm = createAction(FORM_SUBMIT);

addMiddleware([FORM_SUBMIT], ({ store, action, next }) => {
    next(action);
    const { name, onSuccess, onError } = action.payload;
    store.dispatch(setFormLoading({ name, loading: true }));

    store.dispatch(
        typeSave({
            ...action.payload,
            onSuccess: data => {
                store.dispatch(submitFormSuccess({ data, name }));
                typeof onSuccess === "function" && onSuccess(data);
                store.dispatch(setFormLoading({ name, loading: false }));
            },
            onError: error => {
                store.dispatch(submitFormError({ error, name }));
                typeof onError === "function" && onError(error);
                store.dispatch(setFormLoading({ name, loading: false }));
            }
        })
    );
});

export const submitFormSuccess = createAction(FORM_SUBMIT_SUCCESS);

addReducer([FORM_SUBMIT_SUCCESS], formSlice, (state, action) => {
    const { data } = action.payload;
    return {
        data,
        error: null
    };
});

export const submitFormError = createAction(FORM_SUBMIT_ERROR);

addReducer([FORM_SUBMIT_ERROR], formSlice, (state, action) => {
    const { error } = action.payload;
    return {
        error,
        data: null
    };
});
