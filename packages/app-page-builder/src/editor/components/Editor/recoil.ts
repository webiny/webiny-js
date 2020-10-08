import invariant from "invariant";
import { PbDocumentElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { getPlugin } from "@webiny/plugins";
import { Plugin } from "@webiny/plugins/types";
import { atom, RecoilValue, selector, useRecoilState } from "recoil";

// copied from selectors/index.ts because that file will go away
const getPluginType = (name: string): string => {
    const plugin = getPlugin(name);
    return plugin?.type || null;
};
// state.ui
type EditorUiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    slateFocused: boolean;
    activeElement?: PbElement;
};
export const editorUiAtom = atom<EditorUiAtomType>({
    key: "editorUiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        slateFocused: false,
        activeElement: undefined
    }
});

export const editorUiActiveElementSelector = selector<PbElement | undefined>({
    key: "editorUiActiveElementSelector",
    get: ({ get }) => {
        const { activeElement } = get(editorUiAtom);
        return activeElement;
    }
});

// state.ui.plugins
export type EditorPluginsAtomType = {
    [group: string]: Plugin[];
};
export const editorPluginsAtom = atom<EditorPluginsAtomType>({
    key: "editorPluginsAtom",
    default: {}
});
export const isPluginActiveSelectorFactory = (name: string): RecoilValue<boolean> => {
    return selector<boolean>({
        key: `isPluginActiveSelector-${name}`,
        get: ({ get }) => {
            const type = getPluginType(name);
            if (!type) {
                return false;
            }
            const activePlugins = get(editorPluginsAtom);
            const pluginsByType = activePlugins[type];
            if (!pluginsByType) {
                return false;
            }
            return pluginsByType.some(pl => pl.name === name);
        }
    });
};
export const pluginsActiveNamesByTypeSelectorFactory = (type: string): RecoilValue<string[]> => {
    return selector<string[]>({
        key: `pluginsActiveNamesByTypeSelector-${type}`,
        get: ({ get }) => {
            const activePlugins = get(editorPluginsAtom);
            const pluginsByType = activePlugins[type];
            if (!pluginsByType) {
                return [];
            }
            return pluginsByType.map(p => p.name);
        }
    });
};
export const deactivatePluginRecoilAction = (name: string): void => {
    const [editorPlugins, setEditorPlugins] = useRecoilState(editorPluginsAtom);
    const { type } = getPlugin(name) || {};
    if (!type) {
        return;
    }
    const plugins = editorPlugins[type] || [];

    if (plugins.length === 0) {
        return;
    }
    const filtered = plugins.filter(pl => pl.name !== name);
    if (filtered.length !== plugins.length) {
        return;
    }
    // TODO verity that it is better to update state via fn instead of object
    setEditorPlugins(state => {
        return {
            ...state,
            [type]: filtered
        };
    });
};

// state.page
type EditorPageAtomType = {
    content?: PbElement & {
        present?: PbElement;
    };
    settings?: {
        general?: {
            layout?: string;
        };
    };
};
const editorPageAtom = atom<EditorPageAtomType>({
    key: "editorPageAtom",
    default: {}
});
const editorPageSelector = selector<PbElement>({
    key: "editorPageSelector",
    get: ({ get }) => {
        const page = get(editorPageAtom);
        if (page.content?.present) {
            return page.content.present;
        } else if (page.content) {
            return page.content;
        }

        const document = getPlugin<PbDocumentElementPlugin>("pb-editor-page-element-document");
        invariant(
            document,
            `"pb-editor-page-element-document" plugin must exist for Page Builder to work!`
        );
        return document.create();
    }
});
// state.elements
type EditorPageElementsAtom = {
    [id: string]: PbElement;
};
export const editorPageElementsAtom = atom<EditorPageElementsAtom>({
    key: "editorPageElementsAtom",
    default: {}
});
export const editorPageElementsRootElementSelector = selector<PbElement | undefined>({
    key: "editorPageElementsRootElementSelector",
    get: ({ get }) => {
        const elements = get(editorPageElementsAtom);
        const page = get(editorPageSelector);
        // TODO check what actually to do at this point
        // currently there is a possibility that there is no elements under a page.id
        // and it is undefined and that point
        // is it correct or?
        if (!elements[page.id]) {
            return undefined;
        }
        return elements[page.id];
    }
});

export const editorPageLayoutSelector = selector<string | undefined>({
    key: "editorPageLayoutSelector",
    get: ({ get }) => {
        const page = get(editorPageAtom);
        return page.settings?.general?.layout;
    }
});
