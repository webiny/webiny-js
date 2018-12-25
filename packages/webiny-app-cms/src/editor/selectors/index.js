// @flow
import _ from "lodash";
import invariant from "invariant";
import { getPlugin } from "webiny-plugins";
import type { ElementType, DeepElementType, State } from "webiny-app-cms/types";

const getPluginType = (name: string) => {
    const plugin = getPlugin(name);
    return plugin ? plugin.type : null;
};

/**
 * Get editor `ui` state
 */
export const getUi = (state: State): Object => state.ui || {};

/**
 * Get editor `page` state
 */
export const getPage = (state: State): Object => state.page || {};

/**
 * Get editor `revisions` state
 */
export const getRevisions = (state: State): Array<Object> => state.revisions || [];

/**
 * Get editor content.
 */
export const getContent = (state: State): Object => {
    const page = getPage(state);
    if (page.content && page.content.present) {
        return page.content.present;
    } else if (page.content) {
        return page.content;
    }

    const document = getPlugin("cms-element-document");
    invariant(document, `"cms-element-document" plugin must exist for CMS to work!`);
    return document.create();
};

/**
 * Get element and all of its children recursively.
 * WARNING: use carefully as this makes render optimization really difficult when used in `connect`!
 */
export const getElementWithChildren = (state: State, id: string): DeepElementType => {
    const element = getElement(state, id);
    const content = getContent(state);
    return _.get(content, element.path.replace(/\./g, ".elements.").slice(2));
};

/**
 * Get element by ID or path.
 * @param state
 * @param id ID or path of the element
 */
export const getElement = (state: Object, id: string): ElementType => {
    if (state.elements.hasOwnProperty(id)) {
        return state.elements[id];
    }

    // Find by path
    // $FlowFixMe
    return Object.values(state.elements).find(el => el.path === id);
};

/**
 * Get parent element and all of its children recursively
 * WARNING: use carefully as this makes render optimization really difficult when used in `connect`!
 * @param state
 * @param id
 * @returns {*}
 */
export const getParentElementWithChildren = (state: State, id: string): DeepElementType => {
    const element = getElement(state, id);
    const content = getContent(state);
    const parentPaths = element.path.split(".").slice(0, -1);
    if (parentPaths.length === 1) {
        return content;
    }

    return _.get(content, parentPaths.join(".elements.").slice(2));
};

export const getActiveElement = (state: State) => getElement(state, getActiveElementId(state));

/**
 * Get active element ID.
 */
export const getActiveElementId = (state: State): string => getUi(state).activeElement;

/**
 * Get editor plugins (this mostly contains UI state).
 */
export const getPlugins = (state: State): Object => getUi(state).plugins || {};

/**
 * Get editor plugins of certain type (this mostly contains UI state).
 */
export const getPluginsByType = (type: string) => {
    return (state: State) => getPlugins(state)[type] || [];
};

/**
 * Get an active plugin of the given type.
 */
export const getActivePlugins = (type: string) => {
    const pluginsByType = getPluginsByType(type);
    return (state: State) => {
        return pluginsByType(state) || [];
    };
};

/**
 * Get active plugin params
 */
export const getActivePluginParams = (name: string) => {
    const type = getPluginType(name);
    if (typeof type !== "string") {
        return null;
    }
    const pluginsByType = getPluginsByType(type);
    return (state: State) => {
        const plugins = pluginsByType(state);
        if (plugins) {
            const plugin = plugins.find(pl => pl.name === name);
            return plugin ? plugin.params : null;
        }
        return null;
    };
};

export const isPluginActive = (name: string) => {
    const type = getPluginType(name);
    if (typeof type !== "string") {
        // eslint-disable-next-line
        return (state: State) => false;
    }

    const pluginsByType = getPluginsByType(type);

    return (state: State) => {
        return Boolean(pluginsByType(state).find(pl => pl.name === name));
    };
};

/**
 * Get dragging state.
 */
export const getIsDragging = (state: State) => getUi(state).dragging;

/**
 * Get props that need to be passed to an <Element>.
 */
export const getElementProps = (state: State, { id }: Object) => {
    const { activeElement, highlightElement, resizing, dragging } = getUi(state);
    const element = state.elements[id];

    const active = activeElement && activeElement === element.id;
    const highlight = active || (highlightElement && highlightElement === id);

    return {
        active,
        highlight: highlight && !dragging && !resizing
    };
};
