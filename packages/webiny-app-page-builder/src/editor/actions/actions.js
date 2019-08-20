// @flow
import invariant from "invariant";
import dotProp from "dot-prop-immutable";
import gql from "graphql-tag";
import { isEqual, pick, debounce, cloneDeep, merge as _merge } from "lodash";
import {
    createAction,
    addMiddleware,
    addReducer,
    addHigherOrderReducer
} from "webiny-app-page-builder/editor/redux";
import { getPlugin, getPlugins } from "webiny-plugins";
import {
    getPage,
    getElementWithChildren,
    getParentElementWithChildren
} from "webiny-app-page-builder/editor/selectors";
import { updateChildPaths } from "webiny-app-page-builder/editor/utils";
import undoable from "./history";

export const DRAG_START = `Drag start`;
export const DRAG_END = `Drag end`;
export const ELEMENT_CREATED = `Element created`;
export const ELEMENT_DROPPED = `Element dropped`;
export const TOGGLE_PLUGIN = `Toggle plugin`;
export const DEACTIVATE_PLUGIN = `Deactivate plugin`;
export const FOCUS_SLATE_EDITOR = `Focus slate editor`;
export const BLUR_SLATE_EDITOR = `Blur slate editor`;
export const HIGHLIGHT_ELEMENT = `Highlight element`;
export const ACTIVATE_ELEMENT = `Activate element`;
export const DEACTIVATE_ELEMENT = `Deactivate element`;
export const UPDATE_ELEMENT = `Update element`;
export const DELETE_ELEMENT = `Delete element`;
export const FLATTEN_ELEMENTS = `Flatten elements`;
export const SETUP_EDITOR = `Setup editor`;
export const UPDATE_REVISION = `Update revision`;
export const SAVING_REVISION = `Save revision`;
export const START_SAVING = `Started saving`;
export const FINISH_SAVING = `Finished saving`;

/***************** HISTORY REDUCER *****************/
const horStatePath = "page.content";
addHigherOrderReducer(
    [
        UPDATE_ELEMENT,
        DELETE_ELEMENT,
        ELEMENT_DROPPED,
        SETUP_EDITOR,
        "@@redux-undo/UNDO",
        "@@redux-undo/REDO",
        "@@redux-undo/INIT"
    ],
    horStatePath,
    () => {
        return undoable(
            (state = [], action, { statePath, reducer }) => {
                // Get original reducer state path
                const relativeStatePath =
                    statePath !== horStatePath ? statePath.replace(horStatePath + ".", "") : null;
                const relativeStateSlice = relativeStatePath
                    ? dotProp.get(state, relativeStatePath)
                    : state;
                // Execute original reducer
                const newState = reducer(relativeStateSlice, action);
                // Assign new data to HOR state
                return relativeStatePath
                    ? dotProp.set(state, relativeStatePath, newState)
                    : newState;
            },
            {
                initTypes: ["@@redux-undo/INIT"],
                ignoreInitialState: true,
                filter: action => {
                    if (action.payload && action.payload.history === false) {
                        return false;
                    }

                    return true;
                }
            }
        );
    }
);

addReducer(
    ["@@redux-undo/UNDO", "@@redux-undo/REDO", "@@redux-undo/INIT"],
    "page.content",
    state => state
);

/***************** EDITOR ACTIONS *****************/
addReducer([SETUP_EDITOR], null, (state, action) => {
    return { ...state, ...action.payload };
});

export const togglePlugin = createAction(TOGGLE_PLUGIN);
addReducer([TOGGLE_PLUGIN], "ui.plugins", (state, action) => {
    const { name, params, closeOtherInGroup = false } = action.payload;

    const plugin = getPlugin(name);

    if (!plugin) {
        return state;
    }

    let typePlugins = dotProp.get(state, plugin.type);
    if (!Array.isArray(typePlugins)) {
        typePlugins = [];
    }

    const alreadyActive = typePlugins.findIndex(pl => pl.name === plugin.name);

    if (alreadyActive > -1) {
        typePlugins = dotProp.delete(typePlugins, alreadyActive);
    } else {
        if (closeOtherInGroup) {
            typePlugins = [{ name, params }];
        } else {
            typePlugins.push({ name, params });
        }
    }

    return dotProp.set(state, `${plugin.type}`, typePlugins);
});

export const deactivatePlugin = createAction(DEACTIVATE_PLUGIN);
addReducer([DEACTIVATE_PLUGIN], "ui.plugins", (state, action) => {
    const { name } = action.payload;
    const plugin = getPlugin(name);
    if (!plugin) {
        return state;
    }

    let typePlugins = dotProp.get(state, plugin.type);
    if (!Array.isArray(typePlugins)) {
        typePlugins = [];
    }

    const alreadyActive = typePlugins.findIndex(pl => pl.name === plugin.name);

    if (alreadyActive > -1) {
        typePlugins = dotProp.delete(typePlugins, alreadyActive);
    }

    return dotProp.set(state, `${plugin.type}`, typePlugins);
});

export const highlightElement = createAction(HIGHLIGHT_ELEMENT, { log: false });
addReducer([HIGHLIGHT_ELEMENT], "ui.highlightElement", (state, action) => {
    return action.payload.element ? action.payload.element : null;
});

export const activateElement = createAction(ACTIVATE_ELEMENT);
addReducer([ACTIVATE_ELEMENT], "ui.activeElement", (state, action) => {
    return action.payload.element;
});

export const deactivateElement = createAction(DEACTIVATE_ELEMENT);
addReducer([DEACTIVATE_ELEMENT], "ui.activeElement", () => null);

export const focusSlateEditor = createAction(FOCUS_SLATE_EDITOR);
addReducer([FOCUS_SLATE_EDITOR], "ui.slateFocused", () => true);

export const blurSlateEditor = createAction(BLUR_SLATE_EDITOR);
addReducer([BLUR_SLATE_EDITOR], "ui.slateFocused", () => false);

export const dragStart = createAction(DRAG_START);
addReducer([DRAG_START], "ui.dragging", () => true);

export const dragEnd = createAction(DRAG_END);
addReducer([DRAG_END], "ui.dragging", () => false);

export const elementCreated = createAction(ELEMENT_CREATED);

export const updateElement = createAction(UPDATE_ELEMENT);
addReducer(
    [UPDATE_ELEMENT],
    action => {
        const { element } = action.payload;
        if (element.type === "document") {
            return "page.content";
        }
        // .slice(2) removes `0.` from the beginning of the generated path
        return "page.content." + action.payload.element.path.replace(/\./g, ".elements.").slice(2);
    },
    (state, action) => {
        const { element, merge = false } = action.payload;
        if (element.elements && typeof element.elements[0] === "string") {
            delete element["elements"];
        }
        updateChildPaths(element);
        if (!merge) {
            return { ...state, ...element };
        }
        return _merge({}, state, element);
    }
);

export const deleteElement = createAction(DELETE_ELEMENT);
addMiddleware([DELETE_ELEMENT], ({ store, next, action }) => {
    next(action);

    store.dispatch(deactivateElement());
    const state = store.getState();

    let { element } = action.payload;
    let parent = getParentElementWithChildren(state, element.id);

    // Remove child from parent
    // $FlowFixMe
    if (!parent) {
        return;
    }

    const index = parent.elements.findIndex(el => el.id === element.id);
    parent = dotProp.delete(parent, "elements." + index);
    store.dispatch(updateElement({ element: parent }));

    // Execute `onChildDeleted` if defined
    const plugin = getPlugin(parent.type);
    if (!plugin) {
        return;
    }

    if (typeof plugin.onChildDeleted === "function") {
        plugin.onChildDeleted({ element: parent, child: element });
    }
});

export const dropElement = createAction(ELEMENT_DROPPED);
addMiddleware([ELEMENT_DROPPED], ({ store, next, action }) => {
    next(action);

    const state = store.getState();
    const target = getElementWithChildren(state, action.payload.target.id);

    if (!target) {
        return;
    }

    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === target.type);

    if (!plugin) {
        return;
    }

    invariant(
        plugin.onReceived,
        "To accept drops, element plugin must implement `onReceived` function"
    );

    let { source } = action.payload;
    if (source.path) {
        source = getElementWithChildren(state, source.id);
    }

    const targetPlugin = getPlugins("pb-page-element").find(pl => pl.elementType === target.type);

    if (!targetPlugin) {
        return;
    }

    targetPlugin.onReceived({
        source,
        target,
        position: action.payload.target.position
    });
});

export const updateRevision = createAction(UPDATE_REVISION);
addMiddleware([UPDATE_REVISION], ({ store, next, action }) => {
    next(action);

    if (action.payload.history === false) {
        return;
    }

    const { onFinish } = action.meta;
    store.dispatch(saveRevision(null, { onFinish }));
});

addReducer([UPDATE_REVISION], "page", (state, action) => {
    return { ...state, ...action.payload };
});

// Flatten page content
const flattenContent = el => {
    let els = {};
    el.elements =
        Array.isArray(el.elements) &&
        el.elements.map(child => {
            els = { ...els, ...flattenContent(child) };
            return child.id;
        });

    els[el.id] = el;
    return els;
};

addReducer([FLATTEN_ELEMENTS], "elements", (state, action) => {
    return action.payload;
});

addMiddleware(
    [UPDATE_ELEMENT, DELETE_ELEMENT, "@@redux-undo/UNDO", "@@redux-undo/REDO", "@@redux-undo/INIT"],
    ({ store, next, action }) => {
        const result = next(action);

        const state = store.getState();
        if (state.page.content) {
            const content = dotProp.get(state, "page.content.present") || null;
            if (!content) {
                return result;
            }
            const elements = flattenContent(cloneDeep(content));
            store.dispatch({ type: FLATTEN_ELEMENTS, payload: elements, meta: { log: true } });
        }

        return result;
    }
);

/************************* SAVE REVISION *************************/
let lastSavedRevision = null;
const dataChanged = revision => {
    if (!lastSavedRevision) {
        return true;
    }

    const { content, ...other } = revision;
    const { content: lastContent, ...lastOther } = lastSavedRevision;

    return !isEqual(content, lastContent) || !isEqual(other, lastOther);
};

export const saveRevision = createAction(SAVING_REVISION);
let debouncedSave = null;
addMiddleware(
    [UPDATE_REVISION, UPDATE_ELEMENT, DELETE_ELEMENT, "@@redux-undo/UNDO", "@@redux-undo/REDO"],
    ({ store, next, action }) => {
        next(action);

        const { onFinish } = action.meta || {};

        if (action.type === UPDATE_ELEMENT && action.payload.history === false) {
            return;
        }

        const page = getPage(store.getState());
        if (page.locked) {
            return;
        }

        if (debouncedSave) {
            debouncedSave.cancel();
        }

        debouncedSave = debounce(() => store.dispatch(saveRevision(null, { onFinish })), 1000);
        debouncedSave();
    }
);

const startSaving = { type: START_SAVING, payload: { progress: true } };
const finishSaving = { type: FINISH_SAVING, payload: { progress: false } };

addReducer([START_SAVING, FINISH_SAVING], "ui.saving", (state, action) => {
    return action.payload.progress;
});

addMiddleware([SAVING_REVISION], ({ store, next, action }) => {
    next(action);

    const data: Object = getPage(store.getState());
    if (data.locked) {
        return;
    }

    // Construct page payload
    const revision = pick(data, ["title", "snippet", "url", "settings"]);
    revision.content = data.content.present;
    revision.category = data.category.id;

    // Check if API call is necessary
    if (!dataChanged(revision)) {
        return;
    }

    lastSavedRevision = revision;

    const updateRevision = gql`
        mutation UpdateRevision($id: ID!, $data: PbUpdatePageInput!) {
            pageBuilder {
                updateRevision(id: $id, data: $data) {
                    data {
                        id
                        content
                        title
                        published
                        savedOn
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;

    store.dispatch(startSaving);

    action.meta.client
        .mutate({ mutation: updateRevision, variables: { id: data.id, data: revision } })
        .then(data => {
            store.dispatch(finishSaving);
            action.meta.onFinish && action.meta.onFinish();
            return data;
        })
        .catch(err => {
            store.dispatch(finishSaving);
            console.log(err); // eslint-disable-line
        });
});
