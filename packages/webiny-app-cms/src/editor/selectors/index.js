import { createSelector } from "reselect";
import _ from "lodash";

/**
 * Get entire editor state.
 */
export const getEditor = state => state.editor || {};

/**
 * Get editor `ui` state
 */
export const getUi = state => getEditor(state).ui || {};

/**
 * Get editor `tmp` state
 */
export const getTmp = (state, key) => _.get(getEditor(state).tmp, key);

/**
 * Get editor `page` state
 */
export const getPage = (state) => getEditor(state).page;

/**
 * Get editor blocks.
 */
export const getBlocks = state => getPage(state).content.present || [];

/**
 * Get element.
 */
export const getElement = (state, path) => {
    if (!path) {
        return null;
    }
    const blocks = getBlocks(state);
    return _.get(blocks, path.replace(/\./g, ".elements."));
};

export const getParentElement = (state, path) => {
    const parentPath = path
        .split(".")
        .slice(0, -1)
        .join(".elements.");
    const blocks = getBlocks(state);
    return _.cloneDeep(_.get(blocks, parentPath));
};

/**
 * Get active element path.
 */
export const getActiveElementPath = state => getUi(state).activeElement;

/**
 * Get active preview plugin.
 * This is used to render editor content using a custom wrapper.
 * For example: to simulate different device sizes.
 */
export const getActivePreview = state => getUi(state).preview;

/**
 * Get editor plugins (this mostly contains UI state).
 */
export const getPlugins = state => getUi(state).plugins || {};

/**
 * Get editor plugins of certain type (this mostly contains UI state).
 */
export const getPluginsByType = type => {
    return state => getPlugins(state)[type];
};

/**
 * Get active plugin of given type.
 */
export const getActivePlugin = type => {
    const pluginsByType = getPluginsByType(type);
    return state => {
        const plugins = pluginsByType(state);
        return (plugins && plugins.active) || null;
    };
};

/**
 * Get active plugin params
 */
export const getActivePluginParams = type => {
    const pluginsByType = getPluginsByType(type);
    return state => {
        const plugins = pluginsByType(state);
        return (plugins && plugins.params) || null;
    };
};

/**
 * Get active element.
 */
export const getActiveElement = createSelector(
    state => state,
    getActiveElementPath,
    (state, elementPath) => {
        return getElement(state, elementPath);
    }
);

/**
 * Get dragging state.
 */
export const getIsDragging = state => getUi(state).dragging;

/**
 * Get <Element> props.
 */
export const getElementProps = (state, { element }) => {
    const { activeElement, highlightElement, resizing, dragging } = getUi(state);

    const active = activeElement && activeElement === element.path;
    const highlight = active || (highlightElement && highlightElement === element.id);

    return {
        active,
        highlight: highlight && !dragging && !resizing,
        isResizing: resizing,
        isDragging: dragging
    };
};
