// @flow
import { createAction, dispatch, addReducer, addMiddleware } from "webiny-app/redux";
import { default as localStorage } from "store";

const PREFIX = "[ADMIN_THEME]";
const LOCAL_STORAGE_KEY = "webiny_dark_mode";

export const CHOOSE_INITIAL_THEME = `${PREFIX} Init Theme`;
export const ENABLE_DARK_MODE = `${PREFIX} Enable Dark Theme`;
export const DISABLE_DARK_MODE = `${PREFIX} Disable Dark Theme`;
export const TOGGLE_DARK_MODE = `${PREFIX} Toggle Dark Theme`;

export const chooseInitialTheme = createAction(CHOOSE_INITIAL_THEME);
addMiddleware([CHOOSE_INITIAL_THEME], ({ next, action }) => {
    next(action);
    if (localStorage.get(LOCAL_STORAGE_KEY)) {
        dispatch(enableDarkMode());
    }
});

export const enableDarkMode = createAction(ENABLE_DARK_MODE);
addReducer([ENABLE_DARK_MODE], "ui.theme.dark", () => true);
addMiddleware([ENABLE_DARK_MODE], ({ next, action }) => {
    next(action);
    localStorage.set(LOCAL_STORAGE_KEY, 1);
});

export const disableDarkMode = createAction(DISABLE_DARK_MODE);
addReducer([DISABLE_DARK_MODE], "ui.theme.dark", () => false);
addMiddleware([DISABLE_DARK_MODE], ({ next, action }) => {
    next(action);
    localStorage.remove(LOCAL_STORAGE_KEY);
});

export const toggleDarkMode = createAction(TOGGLE_DARK_MODE);
addReducer([TOGGLE_DARK_MODE], "ui.theme.dark", state => !state);
addMiddleware([TOGGLE_DARK_MODE], ({ next, action }) => {
    next(action);
    // FIXME: would be nicer to read these from state argument.
    if (localStorage.get(LOCAL_STORAGE_KEY)) {
        localStorage.remove(LOCAL_STORAGE_KEY);
    } else {
        localStorage.set(LOCAL_STORAGE_KEY, 1);
    }
});
