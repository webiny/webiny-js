// @flow
import { createAction, addReducer } from "webiny-app/redux";

const PREFIX = "[ADMIN_SNACKBAR]";

export const SHOW_SNACKBAR = `${PREFIX} Show`;
export const HIDE_SNACKBAR = `${PREFIX} Hide`;

const showSnackbar = createAction(SHOW_SNACKBAR);
addReducer([SHOW_SNACKBAR], "ui.snackbar", (state, action) => action.payload);

const hideSnackbar = createAction(HIDE_SNACKBAR);
addReducer([HIDE_SNACKBAR], "ui.snackbar", () => null);

export { showSnackbar, hideSnackbar };
