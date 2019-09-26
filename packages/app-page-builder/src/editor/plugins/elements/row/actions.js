// @flow
import { createAction, addReducer } from "@webiny/app-page-builder/editor/redux";

const PREFIX = "[Row]";

export const ROW_RESIZE_START = `${PREFIX} Resize start`;
export const ROW_RESIZE_END = `${PREFIX} Resize end`;

export const resizeStart = createAction(ROW_RESIZE_START);
export const resizeStop = createAction(ROW_RESIZE_END);
addReducer([ROW_RESIZE_START, ROW_RESIZE_END], "ui.resizing", (state, action) => {
    return action.type === ROW_RESIZE_START;
});
