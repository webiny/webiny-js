import { PbElement, PbEditorElement } from "~/types";

export function useIsDynamicElement(element?: PbElement | PbEditorElement) {
    if (element?.data?.dynamicSource?.path) {
        return true;
    }

    if (element?.data?.dynamicSource?.modelId) {
        return true;
    }

    return false;
}
