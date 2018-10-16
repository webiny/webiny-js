import _ from "lodash";
import invariant from "invariant";
import dotProp from "dot-prop-immutable";
import undoable from "redux-undo";
import { createAction, addMiddleware, addReducer, addHigherOrderReducer } from "webiny-app-cms/editor/redux";
import { getPlugin } from "webiny-app/plugins";
import { getElement, getParentElement } from "webiny-app-cms/editor/selectors";
import { updateChildPaths, createElement } from "webiny-app-cms/editor/utils";

export const PREFIX = "[CMS]";

export const DRAG_START = `${PREFIX} Drag start`;
export const DRAG_END = `${PREFIX} Drag end`;
export const ELEMENT_DROPPED = `${PREFIX} Element dropped`;
export const TOGGLE_PLUGIN = `${PREFIX} Toggle plugin`;
export const DEACTIVATE_PLUGIN = `${PREFIX} Deactivate plugin`;
export const FOCUS_SLATE_EDITOR = `${PREFIX} Focus slate editor`;
export const BLUR_SLATE_EDITOR = `${PREFIX} Blur slate editor`;
export const HIGHLIGHT_ELEMENT = `${PREFIX} Highlight element`;
export const ACTIVATE_ELEMENT = `${PREFIX} Activate element`;
export const DEACTIVATE_ELEMENT = `${PREFIX} Deactivate element`;
export const UPDATE_ELEMENT = `${PREFIX} Update element`;
export const DELETE_ELEMENT = `${PREFIX} Delete element`;
export const SET_TMP = `${PREFIX} Set tmp`;

const horStatePath = "editor.revision.content";
addHigherOrderReducer(
    [
        UPDATE_ELEMENT,
        DELETE_ELEMENT,
        ELEMENT_DROPPED,
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
    "editor.revision.content",
    state => state
);

addReducer(["SETUP_EDITOR"], "editor", (state = null, action) => {
    const editorState = { ...state, ...action.payload };
    if (!editorState.revision.content) {
        console.log("Creating initial content");
        editorState.revision.content = createElement("cms-element-document");
    }
    return editorState;
});

export const setTmp = createAction(SET_TMP);
addReducer([SET_TMP], "editor.tmp", (state, action) => {
    return dotProp.set(state, action.payload.key, action.payload.value);
});

export const togglePlugin = createAction(TOGGLE_PLUGIN);
addReducer([TOGGLE_PLUGIN], "editor.ui.plugins", (state, action) => {
    const { name, params } = action.payload;

    const plugin = getPlugin(name);

    return dotProp.set(
        state,
        `${plugin.type}`,
        _.get(state, `${plugin.type}.active`) === name ? null : { active: name, params }
    );
});

export const deactivatePlugin = createAction(DEACTIVATE_PLUGIN);
addReducer([DEACTIVATE_PLUGIN], "editor.ui.plugins", (state, action) => {
    const { name } = action.payload;
    const plugin = getPlugin(name);
    return { ...state, [plugin.type]: null };
});

export const highlightElement = createAction(HIGHLIGHT_ELEMENT, { log: false });
addReducer([HIGHLIGHT_ELEMENT], "editor.ui.highlightElement", (state, action) => {
    return action.payload.element ? action.payload.element : null;
});

export const activateElement = createAction(ACTIVATE_ELEMENT);
addReducer([ACTIVATE_ELEMENT], "editor.ui.activeElement", (state, action) => {
    return action.payload.element;
});

export const deactivateElement = createAction(DEACTIVATE_ELEMENT);
addReducer([DEACTIVATE_ELEMENT], "editor.ui.activeElement", () => null);

export const focusSlateEditor = createAction(FOCUS_SLATE_EDITOR);
addReducer([FOCUS_SLATE_EDITOR], "editor.ui.slateFocused", () => true);

export const blurSlateEditor = createAction(BLUR_SLATE_EDITOR);
addReducer([BLUR_SLATE_EDITOR], "editor.ui.slateFocused", () => false);

export const dragStart = createAction(DRAG_START);
addReducer([DRAG_START], "editor.ui.dragging", () => true);

export const dragEnd = createAction(DRAG_END);
addReducer([DRAG_END], "editor.ui.dragging", () => false);

export const updateElement = createAction(UPDATE_ELEMENT);
addReducer(
    [UPDATE_ELEMENT],
    action => {
        const { element } = action.payload;
        if (element.type === "cms-element-document") {
            return "editor.revision.content";
        }
        return (
            "editor.revision.content." +
            action.payload.element.path.replace(/\./g, ".elements.").slice(2)
        );
    },
    (state, action) => {
        const { element } = action.payload;
        updateChildPaths(element);
        return { ...state, ...element };
    }
);

export const deleteElement = createAction(DELETE_ELEMENT);
addMiddleware([DELETE_ELEMENT], ({ store, next, action }) => {
    next(action);

    store.dispatch(deactivateElement());

    const { element } = action.payload;

    // Remove child from parent
    let parent = getParentElement(store.getState(), element.path);
    const index = parent.elements.findIndex(el => el.id === element.id);
    parent = dotProp.delete(parent, "elements." + index);
    store.dispatch(updateElement({ element: parent }));

    // Execute `onChildDeleted` if defined
    const plugin = getPlugin(parent.type);
    if (typeof plugin.onChildDeleted === "function") {
        plugin.onChildDeleted({ element: parent, child: element });
    }
});

export const dropElement = createAction(ELEMENT_DROPPED);
addMiddleware([ELEMENT_DROPPED], ({ store, next, action }) => {
    next(action);

    const state = store.getState();
    const target = getElement(state, action.payload.target.path);
    const plugin = getPlugin(target.type);

    invariant(
        plugin.onReceived,
        "To accept drops, element plugin must implement `onReceived` function"
    );

    let { source } = action.payload;
    if (source.path) {
        source = getElement(store.getState(), source.path);
    }

    getPlugin(target.type).onReceived({
        store,
        source,
        target,
        position: action.payload.target.position
    });
});
