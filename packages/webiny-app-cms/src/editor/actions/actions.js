import _ from "lodash";
import invariant from "invariant";
import dotProp from "dot-prop-immutable";
import undoable from "./history";
import { cloneDeep } from "lodash";
import {
    createAction,
    addMiddleware,
    addReducer,
    addHigherOrderReducer
} from "webiny-app-cms/editor/redux";
import { getPlugin } from "webiny-app/plugins";
import { getElementWithChildren, getParentElementWithChildren } from "webiny-app-cms/editor/selectors";
import { updateChildPaths } from "webiny-app-cms/editor/utils";

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
export const FLATTEN_ELEMENTS = `${PREFIX} Flatten elements`;
export const SET_TMP = `${PREFIX} Set tmp`;
export const SETUP_EDITOR = `${PREFIX} Setup editor`;
export const SETUP_CONTENT = `${PREFIX} Setup content`;

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

export const setTmp = createAction(SET_TMP);
addReducer([SET_TMP], "tmp", (state, action) => {
    return dotProp.set(state, action.payload.key, action.payload.value);
});

addReducer([SETUP_EDITOR], null, (state, action) => {
    return { ...state, ...action.payload };
});

addReducer([SETUP_CONTENT], "page.content", (state, action) => {
    return { ...state, ...action.payload };
});

export const togglePlugin = createAction(TOGGLE_PLUGIN);
addReducer([TOGGLE_PLUGIN], "ui.plugins", (state, action) => {
    const { name, params } = action.payload;

    const plugin = getPlugin(name);

    return dotProp.set(
        state,
        `${plugin.type}`,
        _.get(state, `${plugin.type}.active`) === name ? null : { active: name, params }
    );
});

export const deactivatePlugin = createAction(DEACTIVATE_PLUGIN);
addReducer([DEACTIVATE_PLUGIN], "ui.plugins", (state, action) => {
    const { name } = action.payload;
    const plugin = getPlugin(name);
    return { ...state, [plugin.type]: null };
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

export const updateElement = createAction(UPDATE_ELEMENT);
addReducer(
    [UPDATE_ELEMENT],
    action => {
        const { element } = action.payload;
        if (element.type === "cms-element-document") {
            return "page.content";
        }
        // .slice(2) removes `0.` from the beginning of the generated path
        return "page.content." + action.payload.element.path.replace(/\./g, ".elements.").slice(2);
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
    const state = store.getState();

    let { element } = action.payload;
    let parent = getParentElementWithChildren(state, element.id);

    // Remove child from parent
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
    const target = getElementWithChildren(state, action.payload.target.id);
    const plugin = getPlugin(target.type);

    invariant(
        plugin.onReceived,
        "To accept drops, element plugin must implement `onReceived` function"
    );

    let { source } = action.payload;
    if (source.path) {
        source = getElementWithChildren(state, source.id);
    }

    getPlugin(target.type).onReceived({
        source,
        target,
        position: action.payload.target.position
    });
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
