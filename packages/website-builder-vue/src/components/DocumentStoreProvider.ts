import {
    defineComponent,
    provide,
    inject,
    watchEffect,
    h,
    type InjectionKey,
    type PropType
} from "vue";
import type { DocumentStore, Document } from "@webiny/website-builder-sdk";
import { documentStoreManager } from "@webiny/website-builder-sdk";

export const DOCUMENT_STORE_KEY: InjectionKey<DocumentStore> = Symbol("WebinyDocumentStore");

/**
 * Creates (or retrieves) the DocumentStore for the given document ID and
 * provides it to all descendants via Vue's provide/inject.
 *
 * Equivalent of the React DocumentStoreProvider context provider.
 */
export const DocumentStoreProvider = defineComponent({
    name: "WebinyDocumentStoreProvider",

    props: {
        id: { type: String, required: true },
        document: { type: Object as PropType<Document | undefined>, default: undefined }
    },

    setup(props, { slots }) {
        const store = documentStoreManager.getStore(props.id);

        watchEffect(() => {
            if (props.document) {
                store.setDocument(props.document);
            }
        });

        provide(DOCUMENT_STORE_KEY, store);

        return () => slots.default?.();
    }
});

/**
 * Composable – retrieve the nearest DocumentStore from the component tree.
 * Must be called inside a setup() that is a descendant of DocumentStoreProvider.
 */
export const useDocumentStore = (): DocumentStore => {
    const store = inject(DOCUMENT_STORE_KEY);
    if (!store) {
        throw new Error("useDocumentStore must be used within a DocumentStoreProvider");
    }
    return store;
};
