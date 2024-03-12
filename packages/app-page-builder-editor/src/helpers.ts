import { generateAlphaNumericId } from "@webiny/utils/generateId";
import { set } from "dot-prop-immutable";
import omit from "lodash/omit";
import { PbEditorElement } from "~/types";

export const getNanoid = () => {
    return generateAlphaNumericId(10);
};

type FlattenElementsType = {
    [id: string]: PbEditorElement;
};
export const flattenElements = (
    el: PbEditorElement,
    parent: string | undefined = undefined
): FlattenElementsType => {
    const els: FlattenElementsType = {};
    els[el.id] = set(
        el,
        "elements",
        (el.elements || []).map(child => {
            if (typeof child === "string") {
                return child;
            }
            const children = flattenElements(child, el.id);
            Object.keys(children).forEach(id => {
                els[id] = omit(children[id], ["path"]) as PbEditorElement;
            });
            return child.id;
        })
    );

    els[el.id].parent = parent;

    return els;
};
