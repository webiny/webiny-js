import { toJS } from "mobx";
import { BindingsProcessor } from "@webiny/app-website-builder/sdk";
import { useViewport } from "./useViewportInfo";
import { useDocumentStore } from "./DocumentStoreProvider";
import { useSelectFromState } from "./useSelectFromState";

export const useBindingsForElement = (elementId: string, breakpoint: string) => {
    const documentStore = useDocumentStore();
    const viewport = useViewport();

    return useSelectFromState(
        () => documentStore.getDocument()!,
        document => {
            const bindings = toJS(document.bindings[elementId]) ?? {};
            const breakpoints = viewport.breakpoints.map(bp => bp.name);

            // Merge element bindings.
            const bindingsProcessor = new BindingsProcessor(breakpoints);

            return bindingsProcessor.getBindings(bindings, breakpoint);
        },
        [elementId, breakpoint]
    );
};
