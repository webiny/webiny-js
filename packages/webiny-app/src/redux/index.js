// @flow
import { applyMiddleware, createStore, compose, combineReducers } from "redux";
import _ from "lodash";
import dotProp from "dot-prop-immutable";

export type Action = {
    type: string,
    payload: Object
};

export type Slice = string | (({ action: Action }) => string);
export type Reducer = Function;
export type Middleware = Function;

export type ActionOptions = {
    slice?: Slice,
    reducer?: Reducer,
    middleware?: Middleware,
    log?: boolean
};

export type Store = {
    dispatch: Function
};

export type State = Object;

export type MiddlewareParams = {
    store: Store,
    next: Function,
    action: Action
};

type MiddlewareFunction = MiddlewareParams => void;

const wrapReducer = (type: string, slice: Slice, reducer: Reducer) => {
    return (state: State, action: Action, key: string) => {
        if (action.type === type) {
            let stateKey = slice;
            if (typeof slice === "function") {
                stateKey = slice({ action });
            }

            // Run reducer if slice matches root reducer key
            if (stateKey.startsWith(`${key}.`) || stateKey === key) {
                // Remove root reducer key from stateKey
                stateKey = stateKey.startsWith(`${key}.`)
                    ? // eslint-disable-next-line
                      stateKey.replace(new RegExp(`^${key}\.`), "")
                    : null;

                // Execute reducer
                const subState = stateKey ? dotProp.get(state, stateKey) : state;
                const result = reducer({ state: subState, root: state, action });
                return stateKey ? dotProp.set(state, stateKey, result) : result;
            }
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
    rootReducers = {};

    createReducer(key: string, initialState: Object = {}) {
        return (state: State = initialState, action: Action) => {
            let newState = _.clone(state);
            this.reducers.forEach(reducer => {
                newState = reducer(newState, action, key);
            });

            return newState;
        };
    }

    on(type: string, options: ActionOptions = {}) {
        const { slice = null, reducer = null, middleware = null } = options;

        if (slice && reducer) {
            this.reducers.push(wrapReducer(type, slice, reducer));
        }

        if (middleware) {
            this.middleware.push(wrapMiddleware(type, middleware));
        }
    }

    action(type: string, options: ?ActionOptions = {}) {
        let slice = null,
            reducer = state => state,
            middleware = null,
            log = true;

        if (options) {
            ({ slice = null, reducer = state => state, middleware = null, log = true } = options);
        }

        if (slice && reducer) {
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

    addRootReducer(key: string, reducer: Reducer) {
        this.rootReducers[key] = reducer;
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
            combineReducers(this.rootReducers),
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

export const addRootReducer = (key: string, factory: ?Function) => {
    let reducer;
    if (typeof factory === "function") {
        const blueprint = factory((...args) => redux.createReducer(...args));
        const reducers = {};
        Object.keys(blueprint).forEach(rKey => {
            const initState = blueprint[rKey];
            if (typeof initState === "function") {
                reducers[rKey] = initState;
            } else {
                reducers[rKey] = redux.createReducer(`${key}.${rKey}`, initState);
            }
        });

        reducer = combineReducers(reducers);
    } else {
        reducer = redux.createReducer(key);
    }
    redux.addRootReducer(key, reducer);
};

export const dispatch = (action: Action) => {
    return redux.store.dispatch(action);
};

export const selectUi = (state: Object) => state.ui || {};
export const selectApp = (state: Object) => state.app || {};
