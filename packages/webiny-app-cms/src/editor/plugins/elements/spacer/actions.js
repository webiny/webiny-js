import { createAction } from "webiny-app/redux";

const PREFIX = "[Spacer]";

export const SPACER_RESIZE_START = `${PREFIX} Resize start`;
export const SPACER_RESIZE_END = `${PREFIX} Resize end`;

export const resizeStart = createAction(SPACER_RESIZE_START, {
    slice: "editor.ui.resizing",
    reducer() {
        return true;
    }
});
export const resizeStop = createAction(SPACER_RESIZE_END, {
    slice: "editor.ui.resizing",
    reducer() {
        return false;
    }
});
