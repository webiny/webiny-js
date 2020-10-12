import { EditorPageAtomType } from "@webiny/app-page-builder/editor/recoil/recoil";
import shortid from "shortid";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";

const fixChildPaths = (elements: PbElement[]): PbElement[] => {
    return (elements as PbElement[]).map((element, index) => {
        const newElement = updateChildPaths(element);
        const path = `${element.path}.${index}`;
        return {
            ...newElement,
            path
        };
    });
};

export const updateChildPaths = (element: PbElement): PbElement => {
    const { id = shortid.generate(), path = "0", type, data, elements } = element;
    return {
        ...element,
        id,
        path,
        type: type,
        data: data,
        elements: fixChildPaths(elements)
    };
};
// eslint-disable-next-line
export const saveEditorPageRevision = (_page: EditorPageAtomType) => {
    // packages/app-page-builder/src/editor/actions/actions.ts:364
};

// Flatten page content
type FlattenElementsType = {
    [id: string]: PbShallowElement;
};
export const flattenContent = (el): FlattenElementsType => {
    let els = {};
    el.elements = (el.elements || []).map(child => {
        els = { ...els, ...flattenContent(child) };
        return child.id;
    });

    els[el.id] = el;
    return els;
};
