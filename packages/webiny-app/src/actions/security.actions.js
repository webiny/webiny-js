// @flow
import { createAction, addRootReducer } from "./../redux";
import { app } from "./..";
const SECURITY = "[SECURITY]";

// Create root state key for all security-related data
addRootReducer("security");

export const AUTH = `${SECURITY} Authenticate`;
export const AUTH_SUCCESS = `${SECURITY} Authentication successful`;
export const AUTH_ERROR = `${SECURITY} Authentication failed`;
export const LOGOUT = `${SECURITY} Logout`;

export const authenticationSuccess = createAction(AUTH_SUCCESS, {
    slice: "security.authentication",
    reducer({ action }) {
        return {
            error: null,
            user: action.payload,
            inProgress: false
        };
    }
});

export const authenticationError = createAction(AUTH_ERROR, {
    slice: "security.authentication",
    reducer({ action }) {
        return {
            error: action.payload,
            user: null,
            inProgress: false
        };
    }
});

export const authenticate = createAction(AUTH, {
    slice: "security.authentication.inProgress",
    reducer() {
        return true;
    },
    async middleware({ store, action, next }) {
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
    }
});

export const logout = createAction(LOGOUT, {
    slice: "security.authentication.user",
    reducer() {
        return null;
    },
    async middleware({ action, next }) {
        next(action);

        await app.security.logout();
    }
});
