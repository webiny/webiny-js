import { createSelector } from "reselect";
import _ from "lodash";
import { getPlugin } from "webiny-app/plugins";

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
 * Get editor `revision` state
 */
export const getRevision = state => getEditor(state).revision || {};

/**
 * Get editor `page` state
 */
export const getPage = state => getEditor(state).page || {};

/**
 * Get editor `revisions` state
 */
export const getRevisions = state => getEditor(state).revisions || [];

/**
 * Get editor content.
 */
export const getContent = state => {
    const revision = getRevision(state);
    if (revision.content && revision.content.present) {
        return revision.content.present;
    } else if (revision.content) {
        return revision.content;
    }

    return getPlugin("cms-element-document").create();
};

/**
 * Get element.
 */
export const getElement = (state, path) => {
    if (!path) {
        return null;
    }
    const content = getContent(state);
    return _.get(content, path.replace(/\./g, ".elements.").slice(2));
};

export const getParentElement = (state, path) => {
    const content = getContent(state);
    const parentPaths = path.split(".").slice(0, -1);
    if (parentPaths.length === 1) {
        return content;
    }
    return _.cloneDeep(_.get(content, parentPaths.join(".elements.").slice(2)));
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
