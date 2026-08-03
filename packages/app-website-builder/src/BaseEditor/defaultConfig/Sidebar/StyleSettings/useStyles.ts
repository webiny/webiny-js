import { useMemo } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { StylesStore, type ElementBreakpointStyles } from "./StylesStore.js";

// Singleton store container
const stylesStores = new Map<string, StylesStore>();

export type { ElementBreakpointStyles };

export function useStyles(elementId: string) {
    const editor = useDocumentEditor();
    const { breakpoints } = useBreakpoint();

    const store = useMemo(() => {
        const cacheKey = [elementId, ...breakpoints].join(";");
        // Create or get existing store for this element
        let store = stylesStores.get(cacheKey);

        if (!store) {
            store = new StylesStore(
                editor,
                elementId,
                breakpoints.map(bp => bp.name)
            );
            stylesStores.set(cacheKey, store);
        }

        return store;
    }, [elementId, breakpoints.length]);

    return {
        store,
        styles: store.vm.styles,
        tokens: store.vm.tokens,
        metadata: store.vm.metadata,
        inheritanceMap: store.vm.inheritanceMap,
        onChange: store.onChange,
        onPreviewChange: store.onPreviewChange
    };
}
