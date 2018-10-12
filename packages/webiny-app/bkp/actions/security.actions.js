// @flow
import { createAction, addReducer, addMiddleware } from "./../redux";
import { app } from "./..";
const SECURITY = "[SECURITY]";

export const AUTH = `${SECURITY} Authenticate`;
export const AUTH_SUCCESS = `${SECURITY} Authentication successful`;
export const AUTH_ERROR = `${SECURITY} Authentication failed`;
export const LOGOUT = `${SECURITY} Logout`;

export const authenticationSuccess = createAction(AUTH_SUCCESS);

addReducer([AUTH_SUCCESS], "security.authentication", (state, action) => {
    return {
        error: null,
        user: action.payload,
        inProgress: false
    };
});

export const authenticationError = createAction(AUTH_ERROR);

addReducer([AUTH_ERROR], "security.authentication", (state, action) => {
    return {
        error: action.payload,
        user: null,
        inProgress: false
    };
});

export const authenticate = createAction(AUTH);

addReducer([AUTH], "security.authentication.inProgress", () => true);
addMiddleware([AUTH], async ({ store, action, next }) => {
    next(action);

    const security = app.security;
    try {
        const { identity, strategy, ...authenticationPayload } = action.payload;
        const result = await security.login(identity, strategy, authenticationPayload);

        if (result.token) {
            store.dispatch(authenticationSuccess(result));
        } else {
            throw Error("Token not received.");
        }
    } catch (e) {
        store.dispatch(authenticationError(e));
    }
});

export const logout = createAction(LOGOUT);

addReducer([LOGOUT], "security.authentication.user", () => null);
addMiddleware([LOGOUT], async ({ action, next }) => {
    next(action);

    await app.security.logout();
});
