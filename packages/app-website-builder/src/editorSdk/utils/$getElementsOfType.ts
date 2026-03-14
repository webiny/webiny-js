import type { Document } from "@webiny/website-builder-sdk";

export function $getElementsOfType(document: Document, componentName: string) {
    return Object.values(document.elements).filter(el => el.component.name === componentName);
}
