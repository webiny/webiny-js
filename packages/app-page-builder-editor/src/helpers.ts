import { customAlphabet } from "nanoid";
import { set } from "dot-prop-immutable";
import omit from "lodash/omit";
import { PbEditorElement } from "~/types";

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const getNanoid = customAlphabet(ALPHANUMERIC, 10);

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
