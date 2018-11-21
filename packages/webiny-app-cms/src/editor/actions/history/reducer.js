// @flowIgnore
import * as debug from "./debug";
import { ActionTypes } from "./actions";
import { parseActions, isHistory, newHistory } from "./helpers";

// createHistory
function createHistory(state, ignoreInitialState) {
    // ignoreInitialState essentially prevents the user from undoing to the
    // beginning, in the case that the undoable reducer handles initialization
    // in a way that can't be redone simply
    let history = newHistory([], state, []);
    if (ignoreInitialState) {
        history._latestUnfiltered = null;
    }
    return history;
}

// lengthWithoutFuture: get length of history
function lengthWithoutFuture(history) {
    return history.past.length + 1;
}

// insert: insert `state` into history, which means adding the current state
//         into `past`, setting the new `state` as `present` and erasing
//         the `future`.
function insert(history, state, limit, group) {
    debug.log("inserting", state);
    debug.log("new free: ", limit - lengthWithoutFuture(history));

    const { past, _latestUnfiltered } = history;
    const historyOverflow = limit && lengthWithoutFuture(history) >= limit;

    const pastSliced = past.slice(historyOverflow ? 1 : 0);
    const newPast = _latestUnfiltered != null ? [...pastSliced, _latestUnfiltered] : pastSliced;

    return newHistory(newPast, state, [], group);
}

// jumpToFuture: jump to requested index in future history
function jumpToFuture(history, index) {
    if (index < 0 || index >= history.future.length) return history;

    const { past, future, _latestUnfiltered } = history;

    const newPast = [...past, _latestUnfiltered, ...future.slice(0, index)];
    const newPresent = future[index];
    const newFuture = future.slice(index + 1);

    return newHistory(newPast, newPresent, newFuture);
}

// jumpToPast: jump to requested index in past history
function jumpToPast(history, index) {
    if (index < 0 || index >= history.past.length) return history;

    const { past, future, _latestUnfiltered } = history;

    const newPast = past.slice(0, index);
    const newFuture = [...past.slice(index + 1), _latestUnfiltered, ...future];
    const newPresent = past[index];

    return newHistory(newPast, newPresent, newFuture);
}

// jump: jump n steps in the past or forward
function jump(history, n) {
    if (n > 0) return jumpToFuture(history, n - 1);
    if (n < 0) return jumpToPast(history, history.past.length + n);
    return history;
}

// helper to dynamically match in the reducer's switch-case
function actionTypeAmongClearHistoryType(actionType, clearHistoryType) {
    return clearHistoryType.indexOf(actionType) > -1 ? actionType : !actionType;
}

// redux-undo higher order reducer
export default function undoable(reducer, rawConfig = {}) {
    debug.set(rawConfig.debug);

    const config = {
        initTypes: parseActions(rawConfig.initTypes, ["@@redux-undo/INIT"]),
        limit: rawConfig.limit,
        filter: rawConfig.filter || (() => true),
        groupBy: rawConfig.groupBy || (() => null),
        undoType: rawConfig.undoType || ActionTypes.UNDO,
        redoType: rawConfig.redoType || ActionTypes.REDO,
        jumpToPastType: rawConfig.jumpToPastType || ActionTypes.JUMP_TO_PAST,
        jumpToFutureType: rawConfig.jumpToFutureType || ActionTypes.JUMP_TO_FUTURE,
        jumpType: rawConfig.jumpType || ActionTypes.JUMP,
        clearHistoryType: Array.isArray(rawConfig.clearHistoryType)
            ? rawConfig.clearHistoryType
            : [rawConfig.clearHistoryType || ActionTypes.CLEAR_HISTORY],
        neverSkipReducer: rawConfig.neverSkipReducer || false,
        ignoreInitialState: rawConfig.ignoreInitialState || false,
        syncFilter: rawConfig.syncFilter || false
    };

    let initialState = config.history;
    return (state = initialState, action = {}, ...slices) => {
        debug.start(action, state);

        let history = state;
        if (!initialState) {
            debug.log("history is uninitialized");

            if (state === undefined) {
                const clearHistoryAction = { type: ActionTypes.CLEAR_HISTORY };
                const start = reducer(state, clearHistoryAction, ...slices);

                history = createHistory(start, config.ignoreInitialState);

                debug.log("do not set initialState on probe actions");
            } else if (isHistory(state)) {
                history = initialState = config.ignoreInitialState
                    ? state
                    : newHistory(state.past, state.present, state.future);
                debug.log("initialHistory initialized: initialState is a history", initialState);
            } else {
                history = initialState = createHistory(state, config.ignoreInitialState);
                debug.log(
                    "initialHistory initialized: initialState is not a history",
                    initialState
                );
            }
        }

        const skipReducer = res =>
            config.neverSkipReducer
                ? {
                      ...res,
                      present: reducer(res.present, action, ...slices)
                  }
                : res;

        let res;
        switch (action.type) {
            case undefined:
                return history;

            case config.undoType:
                res = jump(history, -1);
                debug.log("perform undo");
                debug.end(res);
                return skipReducer(res);

            case config.redoType:
                res = jump(history, 1);
                debug.log("perform redo");
                debug.end(res);
                return skipReducer(res);

            case config.jumpToPastType:
                res = jumpToPast(history, action.index);
                debug.log(`perform jumpToPast to ${action.index}`);
                debug.end(res);
                return skipReducer(res);

            case config.jumpToFutureType:
                res = jumpToFuture(history, action.index);
                debug.log(`perform jumpToFuture to ${action.index}`);
                debug.end(res);
                return skipReducer(res);

            case config.jumpType:
                res = jump(history, action.index);
                debug.log(`perform jump to ${action.index}`);
                debug.end(res);
                return skipReducer(res);

            case actionTypeAmongClearHistoryType(action.type, config.clearHistoryType):
                res = createHistory(history.present, config.ignoreInitialState);
                debug.log("perform clearHistory");
                debug.end(res);
                return skipReducer(res);

            default:
                res = reducer(history.present, action, ...slices);

                if (config.initTypes.some(actionType => actionType === action.type)) {
                    debug.log("reset history due to init action");
                    debug.end(initialState);
                    history = initialState = createHistory(state, config.ignoreInitialState);
                    return initialState;
                }

                if (history._latestUnfiltered === res) {
                    // Don't handle this action. Do not call debug.end here,
                    // because this action should not produce side effects to the console
                    return history;
                }

                const filtered =
                    typeof config.filter === "function" && !config.filter(action, res, history);

                if (filtered) {
                    // if filtering an action, merely update the present
                    let filteredState = newHistory(
                        history.past,
                        res,
                        history.future,
                        history.group
                    );
                    if (!config.syncFilter) {
                        filteredState._latestUnfiltered = history._latestUnfiltered;
                    }
                    debug.log("filter ignored action, not storing it in past");
                    debug.end(filteredState);
                    return filteredState;
                }

                const group = config.groupBy(action, res, history);
                if (group != null && group === history.group) {
                    // if grouping with the previous action, only update the present
                    const groupedState = newHistory(
                        history.past,
                        res,
                        history.future,
                        history.group
                    );
                    debug.log("groupBy grouped the action with the previous action");
                    debug.end(groupedState);
                    return groupedState;
                }

                // If the action wasn't filtered or grouped, insert normally
                history = insert(history, res, config.limit, group);

                debug.log("inserted new state into history");
                debug.end(history);
                return history;
        }
    };
}
