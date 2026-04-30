import { computed, type Ref } from "vue";
import { toJS } from "mobx";
import { BindingsProcessor } from "@webiny/website-builder-sdk";
import { useViewport } from "./useViewport.js";
import { useObservable } from "./useObservable.js";
import { useDocumentStore } from "~/components/DocumentStoreProvider.js";

/**
 * Returns a Vue computed ref containing the merged bindings (inputs + styles)
 * for the given element ID at the current breakpoint.
 *
 * Re-evaluates automatically when:
 *  - the MobX document store changes (via useObservable)
 *  - the breakpoint ref changes
 *  - the viewport breakpoints change
 */
export const useBindingsForElement = (elementId: string, breakpoint: Ref<string>) => {
    const documentStore = useDocumentStore();
    const viewport = useViewport();

    // Observe this element's bindings directly inside the MobX autorun so that
    // deep mutations from applyPatch (e.g. adding a child element) trigger a
    // re-render without needing the top-level document reference to change.
    // toJS() inside the autorun causes MobX to track all sub-properties.
    const elementBindings = useObservable(() => {
        const doc = documentStore.getDocument();
        if (!doc) {
            return undefined;
        }
        return toJS(doc.bindings[elementId]);
    });

    return computed(() => {
        const bindings = elementBindings.value ?? {};
        const breakpoints =
            viewport.value?.breakpoints?.map((bp: { name: string }) => bp.name) ?? [];
        const processor = new BindingsProcessor(breakpoints);
        return processor.getBindings(bindings, breakpoint.value);
    });
};
