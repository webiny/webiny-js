// @flow
import { clone } from "lodash";
import { get, set } from "dot-prop-immutable";
import type { Redux, Reducer, State, Action, StatePath } from "@webiny/app-page-builder/types";

type ReducerCollection = Array<{ statePath: StatePath, reducer: Reducer, actions: Array<string> }>;

const findHigherOrderReducer = (
    reducers: ReducerCollection,
    statePath: StatePath,
    action: Action
) => {
    for (let i = 0; i < reducers.length; i++) {
        const hor = reducers[i];
        if (hor.actions.includes(action.type)) {
            if (!hor.statePath) {
                // If HOR does not have a slice defined it means it will process the entire app state
                return { statePath: null, reducer: hor.reducer };
            }

            // Normalize statePath using current action
            const horStatePath = resolveStatePath(hor.statePath, action);

            if (
                statePath &&
                horStatePath &&
                (statePath.startsWith(horStatePath + ".") || statePath === horStatePath)
            ) {
                return { statePath: horStatePath, reducer: hor.reducer };
            }
        }
    }

    return null;
};

const runReducer = (appState, action, extra, reducer, statePath) => {
    // Get a slice of state for this reducer
    const stateSlice = statePath ? get(appState, statePath) : appState;
    // Run reducer and update app state
    const newState = reducer(stateSlice, action, extra);
    return statePath ? set(appState, statePath, newState) : newState;
};

// Resolve statePath to string
const resolveStatePath = (statePath: StatePath, action: Action): null | string => {
    if (typeof statePath === "function") {
        return statePath(action);
    }

    return statePath;
};

export default (INIT_STATE: Object = {}, redux: Redux): Reducer => {
    return (state: State = INIT_STATE, action: Action) => {
        let newState = clone(state);
        redux.reducers.forEach(({ statePath, reducer, actions }) => {
            if (!actions.includes(action.type)) {
                return;
            }

            statePath = resolveStatePath(statePath, action);

            // If requested statePath triggers a higher order reducer - delegate processing to that HOR
            const horDef = findHigherOrderReducer(redux.higherOrderReducers, statePath, action);

            if (horDef) {
                // Run HOR and pass the original {slice, reducer} that triggered this HOR
                newState = runReducer(
                    newState,
                    action,
                    { statePath, reducer },
                    horDef.reducer,
                    horDef.statePath
                );
            } else {
                newState = runReducer(newState, action, {}, reducer, statePath);
            }
        });

        return newState;
    };
};
