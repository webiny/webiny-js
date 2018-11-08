// @flow
import { createAction, addReducer, addMiddleware } from "webiny-app-cms/editor/redux";
import { saveRevision } from "webiny-app-cms/editor/actions";
const PREFIX = "[Page settings]";

export const UPDATE_REVISION = `${PREFIX} Update page`;
export const SET_PREVIEW_LAYOUT = `${PREFIX} Set preview layout page`;

export const updateRevision = createAction(UPDATE_REVISION);
addMiddleware([UPDATE_REVISION], ({ store, next, action }) => {
    next(action);

    if (action.payload.history === false) {
        return;
    }

    store.dispatch(saveRevision());
});

addReducer([UPDATE_REVISION], "page", (state, action) => {
    return { ...state, ...action.payload };
});

export const setPreviewLayout = createAction(SET_PREVIEW_LAYOUT);
addReducer([SET_PREVIEW_LAYOUT], "previewLayout", (state, action) => action.payload.layout);
