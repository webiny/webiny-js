import {
    flattenContent,
    saveEditorPageRevision,
    updateChildPaths
} from "@webiny/app-page-builder/editor/recoil/utils";
import invariant from "invariant";
import {
    PbDocumentElementPlugin,
    PbElement,
    PbShallowElement
} from "@webiny/app-page-builder/types";
import { getPlugin } from "@webiny/plugins";
import { Plugin } from "@webiny/plugins/types";
import { atom, selector, selectorFamily, useRecoilState, useSetRecoilState } from "recoil";
import { useBatching } from "recoil-undo";
import lodashCloneDeep from "lodash/cloneDeep";
import lodashMerge from "lodash/merge";
import lodashSet from "lodash/set";
import lodashGet from "lodash/get";

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
    activeElement?: string;
    highlightElement?: string;
};
export const editorUiAtom = atom<EditorUiAtomType>({
    key: "editorUiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        slateFocused: false,
        activeElement: undefined,
        highlightElement: undefined
    }
});

export const editorUiActiveElementSelector = selector<string | undefined>({
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
export const isPluginActiveSelectorFamily = selectorFamily<boolean, string>({
    key: "isPluginActiveSelectorFamily",
    get: name => {
        return ({ get }) => {
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
        };
    }
});
export const pluginsActiveNamesByTypeSelectorFamily = selectorFamily<string[], string>({
    key: `pluginsActiveNamesByTypeSelectorFamily`,
    get: type => {
        return ({ get }) => {
            const activePlugins = get(editorPluginsAtom);
            const pluginsByType = activePlugins[type];
            if (!pluginsByType) {
                return [];
            }
            return pluginsByType.map(p => p.name);
        };
    }
});
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

type EditorPageCategoryType = {
    id: string;
    name: string;
    url: string;
};

// state.page
export type EditorPageAtomType = {
    id?: string;
    title?: string;
    url?: string;
    content?: PbElement;
    settings?: {
        general?: {
            layout?: string;
        };
    };
    parent?: string;
    version: number;
    elements: PbElement[];
    locked: boolean;
    published: boolean;
    isHomePage: boolean;
    isErrorPage: boolean;
    isNotFoundPage: boolean;
    savedOn?: Date;
    snippet: string | null;
    category?: EditorPageCategoryType;
};
const editorPageAtom = atom<EditorPageAtomType>({
    key: "editorPageAtom",
    default: {
        elements: [],
        locked: false,
        version: 1,
        published: false,
        isHomePage: false,
        isErrorPage: false,
        isNotFoundPage: false,
        snippet: null
    }
});
export const editorPageSelector = selector<PbElement>({
    key: "editorPageSelector",
    get: ({ get }) => {
        const page = get(editorPageAtom);
        if (page.content) {
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
export const editorPageLayoutSelector = selector<string | undefined>({
    key: "editorPageLayoutSelector",
    get: ({ get }) => {
        const page = get(editorPageAtom);
        return page.settings?.general?.layout;
    }
});

// state.elements
type EditorPageFlatElementsAtom = {
    [id: string]: PbShallowElement;
};
const editorPageFlatElementsAtom = atom<EditorPageFlatElementsAtom>({
    key: "editorPageElementsAtom",
    default: {}
});
export const elementByIdSelectorFamily = selectorFamily<PbShallowElement, string>({
    key: "elementByIdSelectorFamily",
    get: id => {
        return ({ get }) => {
            const elements = get(editorPageFlatElementsAtom);
            if (elements.hasOwnProperty(id)) {
                return elements[id];
            }
            const element = Object.values(elements).find(el => el.path === id);
            // TODO verify that element not existing can ever happen actually?
            if (!element) {
                throw new Error(`There is no element with id or path "${id}"`);
            }
            return element;
        };
    }
});

type ElementByIdSelectorProps = {
    isActive: boolean;
    isHighlighted: boolean;
};
export const elementPropsByIdSelectorFamily = selectorFamily<ElementByIdSelectorProps, string>({
    key: "elementPropsByIdSelectorFamily",
    get: id => {
        return ({ get }) => {
            const element = get(elementByIdSelectorFamily(id));
            const { isDragging, isResizing, activeElement, highlightElement } = get(editorUiAtom);

            const active = activeElement && activeElement === element.id;
            const highlight = active || highlightElement === id;

            return {
                isActive: active,
                isHighlighted: highlight && !isDragging && !isResizing
            };
        };
    }
});

// global actions
const createElementWithoutElementsAsString = (element: PbElement): PbElement => {
    if (!element.elements || typeof element.elements[0] !== "string") {
        return element;
    }
    throw new Error("This should never happen.");
    // return {
    //     ...element,
    //     elements: [],
    // };
};
/**
 * when element update happens:
 * 1. update page content
 * 2. flatten content and update elements
 * 3. save revision if revision history is allowed
 */
type UpdateElementType = {
    element: PbElement;
    merge?: boolean;
    history?: boolean;
};

const cloneAndMergePageContentState = (
    page: EditorPageAtomType,
    element: PbElement,
    merge: boolean
) => {
    const newElement = updateChildPaths(createElementWithoutElementsAsString(element));
    if (!merge) {
        return {
            ...(page.content || {}),
            ...newElement
        };
    }
    return lodashMerge(page.content, newElement);
};
/**
 * TODO find a better way
 * this builds new page content state
 * using dot-prop-immutable so we can target deeply nested elements
 */
const buildNewPageContentState = (
    { content }: EditorPageAtomType,
    element: PbElement,
    merge: boolean
) => {
    const newElement = updateChildPaths(createElementWithoutElementsAsString(element));
    // .slice(2) removes `0.` from the beginning of the generated path
    const path = element.path.replace(/\./g, ".elements.").slice(2);
    const existingElement = lodashGet(content, path);
    if (merge) {
        return lodashSet(content, path, lodashMerge(existingElement, newElement));
    }
    return lodashSet(content, path, element);
};
const createNewPageState = (page: EditorPageAtomType, element: PbElement, merge: boolean) => {
    if (element.type === "document") {
        const content = cloneAndMergePageContentState(page, element, merge);
        return {
            ...page,
            content
        };
    }
    return {
        ...page,
        content: buildNewPageContentState(page, element, merge)
    };
};
export const updateElementRecoil = ({ element, merge, history }: UpdateElementType) => {
    // find out which path are we updating
    // if type is document, we will update editorPageAtom.content
    const [page, setPage] = useRecoilState(editorPageAtom);
    const setElements = useSetRecoilState(editorPageFlatElementsAtom);
    const { startBatch, endBatch } = useBatching();

    const newPageState = createNewPageState(lodashCloneDeep(page), element, merge);
    startBatch();
    setPage(newPageState);
    setElements(flattenContent(newPageState.content));
    if (history === true) {
        saveEditorPageRevision(newPageState);
    }
    endBatch();
};
