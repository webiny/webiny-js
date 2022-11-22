import { useContext } from "react";
import { ElementContext } from "~/editor/contexts/ElementProvider";
import { PbEditorElement } from "~/types";

export interface UseCurrentElement {
    element: PbEditorElement;
}

export function useCurrentElement(): UseCurrentElement {
    const context = useContext(ElementContext);
    if (!context) {
        throw Error(`"useCurrentElement" must be used within an <ElementProvider>!`);
    }

    return { element: context.element };
}
