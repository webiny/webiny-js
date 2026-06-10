import { computed } from "vue";
import { useObservable } from "./useObservable.js";
import { useDocumentStore } from "~/components/DocumentStoreProvider.js";

/**
 * Returns a Vue computed ref containing the document's `state` object.
 * Re-evaluates whenever the MobX document store changes.
 */
export const useDocumentState = () => {
    const documentStore = useDocumentStore();
    const document = useObservable(() => documentStore.getDocument());
    return computed(() => document.value?.state ?? {});
};
