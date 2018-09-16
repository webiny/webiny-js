// @flow
import { createAction } from "webiny-app/redux";

const PREFIX = "[ADMIN_SNACKBAR]";

export const SHOW_SNACKBAR = `${PREFIX} Show`;
export const HIDE_SNACKBAR = `${PREFIX} Hide`;

const showSnackbar = createAction(SHOW_SNACKBAR, {
    slice: "ui.snackbar",
    reducer: ({ action }) => action.payload
});

const hideSnackbar = createAction(HIDE_SNACKBAR, {
    slice: "ui.snackbar",
    reducer: () => null
});

export { showSnackbar, hideSnackbar };
