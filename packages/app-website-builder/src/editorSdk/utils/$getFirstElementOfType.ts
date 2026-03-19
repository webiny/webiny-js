import type { Document } from "@webiny/website-builder-sdk";

export function $getFirstElementOfType(document: Document, componentName: string) {
    return Object.values(document.elements).find(el => el.component.name === componentName);
}
