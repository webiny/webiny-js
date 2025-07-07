import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useDocumentEditor } from "~/DocumentEditor";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint";
import { StylesStore, StyleStoreVm } from "./StylesStore";
import { NullMetadata } from "~/BaseEditor/metadata";

// Singleton store container
const stylesStores = new Map<string, StylesStore>();

export function useStyles(elementId: string) {
    const [vm, setVm] = useState<StyleStoreVm>({
        styles: {},
        metadata: new NullMetadata(),
        inheritanceMap: {}
    });
    const editor = useDocumentEditor();
    const { breakpoints } = useBreakpoint();

    const store = useMemo(() => {
        // Create or get existing store for this element
        let store = stylesStores.get(elementId);

        if (!store) {
            store = new StylesStore(
                editor,
                elementId,
                breakpoints.map(bp => bp.name)
            );
            stylesStores.set(elementId, store);
        }

        return store;
    }, [elementId]);

    useEffect(() => {
        setVm(store.vm);
    }, []);

    useEffect(() => {
        autorun(() => {
            setVm(store.vm);
        });
    }, [store]);

    return {
        styles: vm.styles,
        metadata: vm.metadata,
        inheritanceMap: vm.inheritanceMap,
        onChange: store.onChange,
        onPreviewChange: store.onPreviewChange
    };
}
