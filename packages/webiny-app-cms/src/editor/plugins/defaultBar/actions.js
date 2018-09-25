import { createAction } from "webiny-app/redux";
const PREFIX = "[Page settings]";

export const UPDATE_PAGE = `${PREFIX} Update page`;
export const SET_PREVIEW_LAYOUT = `${PREFIX} Set preview layout page`;

export const updatePage = createAction(UPDATE_PAGE, {
    slice: "editor.page",
    reducer({ state, action }) {
        return { ...state, ...action.payload };
    }
});

export const setPreviewLayout = createAction(SET_PREVIEW_LAYOUT, {
    slice: "editor.previewLayout",
    reducer({ state, action }) {
        return action.payload.layout;
    }
});
