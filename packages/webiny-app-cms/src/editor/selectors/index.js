// @flow
import _ from "lodash";
import { getPlugin } from "webiny-plugins";

/**
 * Get editor `ui` state
 */
export const getUi = state => state.ui || {};

/**
 * Get editor `tmp` state
 */
export const getTmp = (state, key) => _.get(state.tmp, key);

/**
 * Get editor `page` state
 */
export const getPage = state => state.page || {};

/**
 * Get editor `revisions` state
 */
export const getRevisions = state => state.revisions || [];

/**
 * Get editor content.
 */
export const getContent = state => {
    const page = getPage(state);
    if (page.content && page.content.present) {
        return page.content.present;
    } else if (page.content) {
        return page.content;
    }

    return getPlugin("cms-element-document").create();
};

/**
 * Get element.
 */
export const getElementWithChildren = (state, id) => {
    const element = getElement(state, id);
    const content = getContent(state);
    return _.get(content, element.path.replace(/\./g, ".elements.").slice(2));
};

export const getElement = (state, id) => {
    return state.elements[id];
};

export const getParentElementWithChildren = (state, id) => {
    const element = getElement(state, id);
    const content = getContent(state);
    const parentPaths = element.path.split(".").slice(0, -1);
    if (parentPaths.length === 1) {
        return content;
    }

    return _.get(content, parentPaths.join(".elements.").slice(2));
};

/**
 * Get active element path.
 */
export const getActiveElementId = state => getUi(state).activeElement;

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
 * Get an active plugin of the given type.
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
 * Get dragging state.
 */
export const getIsDragging = state => getUi(state).dragging;

/**
 * Get <Element> props.
 */
export const getElementProps = (state, { id }) => {
    const { activeElement, highlightElement, resizing, dragging } = getUi(state);
    const element = state.elements[id];

    const active = activeElement && activeElement === element.id;
    const highlight = active || (highlightElement && highlightElement === id);

    return {
        active,
        highlight: highlight && !dragging && !resizing
    };
};
