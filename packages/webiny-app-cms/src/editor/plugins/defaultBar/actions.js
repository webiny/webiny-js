// @flow
import { createAction, addReducer } from "webiny-app/redux";
const PREFIX = "[Page settings]";

export const UPDATE_PAGE = `${PREFIX} Update page`;
export const SET_PREVIEW_LAYOUT = `${PREFIX} Set preview layout page`;

export const updatePage = createAction(UPDATE_PAGE);
addReducer([UPDATE_PAGE], "editor.page", (state, action) => {
    return { ...state, ...action.payload };
});

export const setPreviewLayout = createAction(SET_PREVIEW_LAYOUT);
addReducer([SET_PREVIEW_LAYOUT], "editor.previewLayout", (state, action) => action.payload.layout);
