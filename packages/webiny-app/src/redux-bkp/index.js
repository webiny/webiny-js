// @flow
import { applyMiddleware, createStore, compose } from "redux";
import _ from "lodash";
import dotProp from "dot-prop-immutable";

export type Action = {
    type: string,
    payload: Object
};

export type Slice = null | string | (({ action: Action }) => string);
export type Reducer = Function;
export type Middleware = Function;

export type ActionOptions = {
    slice?: Slice,
    reducer?: Reducer,
    middleware?: Middleware,
    log?: boolean
};

export type Store = {
    dispatch: Function,
    getState: Function
};

export type State = Object;

export type MiddlewareParams = {
    store: Store,
    next: Function,
    action: Action
};

type MiddlewareFunction = MiddlewareParams => void;

const wrapReducer = (type: string, slice: Slice, reducer: Reducer) => {
    return (state: State, action: Action, options: Object = { slicePrefix: null }) => {
        if (action.type === type) {
            let stateKey = slice || "";
            if (typeof slice === "function") {
                stateKey = slice({ action });
            }

            // Lack of slicePrefix means we are NOT in a custom reducer
            if (options.slicePrefix === null) {
                const cr = redux.customReducers.find(
                    r => stateKey.startsWith(r.key) || stateKey === r.key
                );
                // For custom reducers...

                if (cr) {
                    const crState = dotProp.get(state, cr.key);
                    const newState = cr.reducer(crState, action);
                    // Now set the result to the original slice key
                    return dotProp.set(state, cr.key, newState);
                }
            } else if (stateKey.startsWith(options.slicePrefix)) {
                stateKey = stateKey.slice(options.slicePrefix.length + 1);
            }

            // Execute action reducer
            const subState = stateKey ? dotProp.get(state, stateKey) : state;
            const result = reducer({ state: subState, root: state, action });
            return stateKey ? dotProp.set(state, stateKey, result) : result;
        }

        return state;
    };
};

const wrapMiddleware = (type: string, middleware: MiddlewareFunction) => {
    return (store: Store) => (next: Function) => (action: Action) => {
        if (action.type === type) {
            middleware({ store, next, action });
        } else {
            next(action);
        }
    };
};

class Redux {
    store: Store;
    middleware = [];
    reducers = [];
    customReducers = [];

    /**
     * HOR constructor
     * @param key
     * @param initialState
     * @returns {function(State=, Action): State}
     */
    createReducer(key: string, initialState: Object = {}) {
        // State here is the HOR state slice
        return (state: State = initialState, action: Action) => {
            let newState = _.clone(state);
            this.reducers.forEach(reducer => {
                newState = reducer(newState, action, { slicePrefix: key });
            });

            return newState;
        };
    }

    rootReducer = (INIT_STATE: Object = {}) => {
        return (state: State = INIT_STATE, action: Action) => {
            let newState = _.clone(state);
            this.reducers.forEach(reducer => {
                newState = reducer(newState, action);
            });

            return newState;
        };
    };

    on(type: string, options: ActionOptions = {}) {
        const { slice = null, reducer = null, middleware = null } = options;

        if (reducer) {
            this.reducers.push(wrapReducer(type, slice, reducer));
        }

        if (middleware) {
            this.middleware.push(wrapMiddleware(type, middleware));
        }
    }

    action(type: string, options: ?ActionOptions = {}) {
        let slice = null,
            reducer = ({ state }) => state,
            middleware = null,
            log = true;

        if (options) {
            ({ slice = null, reducer = ({ state }) => state, middleware = null, log = true } = options);
        }

        if (reducer) {
            this.reducers.push(wrapReducer(type, slice, reducer));
        }

        if (middleware) {
            this.middleware.push(wrapMiddleware(type, middleware));
        }

        // Return an action creator
        const action = { type };

        return (payload: Object = {}) => {
            return { ...action, payload, meta: { log } };
        };
    }

    // eslint-disable-next-line
    initStore(INIT_STATE: Object = {}, middleware: Array<Function> = []) {
        // dev tool
        const reduxDevTools = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
        const composeEnhancers =
            (reduxDevTools &&
                reduxDevTools({
                    predicate: (state, action) => _.get(action, "meta.log", true)
                })) ||
            compose;

        this.store = createStore(
            this.rootReducer(INIT_STATE),
            composeEnhancers(applyMiddleware(...middleware, ...this.middleware))
        );

        this.store.dispatch({ type: "INIT" });

        return this.store;
    }
}

export const redux = new Redux();

export const createAction = (type: string, options: ?ActionOptions) => {
    return redux.action(type, options);
};

export const onAction = (type: string, options: ActionOptions) => {
    return redux.on(type, options);
};

export const addReducer = (key: string, factory: Function) => {
    redux.customReducers.push({ key, reducer: factory(redux.createReducer.bind(redux)) });
};

export const dispatch = (action: Action) => {
    return redux.store.dispatch(action);
};

export const selectUi = (state: Object) => state.ui || {};
export const selectApp = (state: Object) => state.app || {};
