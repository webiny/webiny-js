import { defineComponent, shallowRef, onMounted, h, type PropType } from "vue";
import { contentSdk, type Component, type Document } from "@webiny/website-builder-sdk";
import { DocumentStoreProvider } from "./DocumentStoreProvider.js";
import { ElementRenderer } from "./ElementRenderer.js";

/**
 * Used in editing mode: fetches a fresh copy of the page from the SDK,
 * then mounts a DocumentStoreProvider + ElementRenderer for it.
 *
 * `document` is optional — when omitted (e.g. the live page is a draft not
 * yet published), the current URL pathname is used as the page path so the
 * editing SDK can still receive the document via the editor's postMessage.
 *
 * Equivalent of the React ConnectToEditor component.
 */
export const ConnectToEditor = defineComponent({
    name: "WebinyConnectToEditor",

    props: {
        document: { type: Object as PropType<Document | undefined>, default: undefined },
        components: { type: Array as PropType<Component[]>, required: true }
    },

    setup(props) {
        const data = shallowRef<Document | null>(null);

        onMounted(() => {
            const path = props.document?.properties?.path ?? window.location.pathname;
            contentSdk.getPage(path).then(doc => {
                data.value = doc;
            });
        });

        return () => {
            if (!data.value) {
                return null;
            }

            return h(
                DocumentStoreProvider,
                { id: data.value.id, document: data.value },
                { default: () => h(ElementRenderer, { id: "root" }) }
            );
        };
    }
});
