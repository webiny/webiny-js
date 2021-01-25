import React from "react";
import { getGlobalState } from "@webiny/app-page-builder/editor/provider";
import {
    activeElementAtom,
    elementByIdSelector,
    getElementWithChildrenById
} from "@webiny/app-page-builder/editor/recoil/modules";
import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const pickKeys = (element: PbElement | PbShallowElement, keys?: string[]) => {
    if (!keys || keys.length === 0) {
        return element;
    }
    return keys.reduce((target, key) => {
        target[key] = element[key];
        return target;
    }, {});
};

const getActiveElement = (
    state: PbState,
    element: PbShallowElement | undefined,
    propName: string,
    shallow: boolean,
    keys: string[] = []
) => {
    if (!element) {
        return {
            [propName]: null
        };
    }
    if (shallow || (keys.length > 0 && keys.includes("elements") === false)) {
        return {
            [propName]: pickKeys(element, keys)
        };
    }
    const elementWithChildren = getElementWithChildrenById(state, element.id);
    return {
        [propName]: pickKeys(elementWithChildren, keys)
    };
};

export function withActiveElement({ propName = "element", shallow = false, keys = [] } = {}) {
    return function decorator(Component: React.ComponentType<any>) {
        return function ActiveElementComponent(props: any) {
            const state = getGlobalState();
            const activeElementId = useRecoilValue(activeElementAtom);
            const element = useRecoilValue(elementByIdSelector(activeElementId));
            const activeElement = getActiveElement(state, element, propName, shallow, keys);
            return <Component {...props} {...activeElement} />;
        };
    };
}
