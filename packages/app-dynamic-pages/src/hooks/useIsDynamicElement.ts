import { PbElement, PbEditorElement } from "~/types";

export function useIsDynamicElement(element?: PbElement | PbEditorElement) {
    const { path, modelId } = element?.data?.dynamicSource || {};

    if (path || modelId) {
        return true;
    }

    return false;
}
