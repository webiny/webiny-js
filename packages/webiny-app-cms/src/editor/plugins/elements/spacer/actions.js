// @flow
import { createAction, addReducer } from "webiny-app-cms/editor/redux";

const PREFIX = "[Spacer]";

export const SPACER_RESIZE_START = `${PREFIX} Resize start`;
export const SPACER_RESIZE_END = `${PREFIX} Resize end`;

export const resizeStart = createAction(SPACER_RESIZE_START);
export const resizeStop = createAction(SPACER_RESIZE_END);
addReducer([SPACER_RESIZE_START, SPACER_RESIZE_END], "ui.resizing", (state, action) => {
    return action.type === SPACER_RESIZE_START;
});
