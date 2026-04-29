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

    // Bridge MobX document → Vue shallowRef.
    const document = useObservable(() => documentStore.getDocument());

    return computed(() => {
        if (!document.value) {return {};}

        const bindings = toJS(document.value.bindings[elementId]) ?? {};
        const breakpoints =
            viewport.value?.breakpoints?.map((bp: { name: string }) => bp.name) ?? [];
        const processor = new BindingsProcessor(breakpoints);
        return processor.getBindings(bindings, breakpoint.value);
    });
};
