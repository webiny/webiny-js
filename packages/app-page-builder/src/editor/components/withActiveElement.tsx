import {
    activeElementIdSelector,
    elementByIdSelector,
    elementWithChildrenByIdSelector
} from "@webiny/app-page-builder/editor/recoil/modules";
import React from "react";
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

const getActiveElement = (propName: string, shallow: boolean, keys?: string[]) => {
    const elementId = useRecoilValue(activeElementIdSelector);
    if (!elementId) {
        return {
            [propName]: null
        };
    }
    if (shallow || (keys?.length > 0 && keys.includes("elements") === false)) {
        const element = useRecoilValue(elementByIdSelector(elementId));
        return {
            [propName]: pickKeys(element, keys)
        };
    }
    const elementWithChildren = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    return {
        [propName]: pickKeys(elementWithChildren, keys)
    };
};

export function withActiveElement({ propName = "element", shallow = false, keys = [] } = {}) {
    return function decorator(Component: React.ComponentType<any>) {
        return function ActiveElementComponent(props: any) {
            const activeElement = getActiveElement(propName, shallow, keys);
            return <Component {...props} {...activeElement} />;
        };
    };
}
