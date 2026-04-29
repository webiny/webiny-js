import { defineComponent, ref, onMounted, h, type PropType } from "vue";
import { contentSdk, type Component, type Document } from "@webiny/website-builder-sdk";
import { DocumentStoreProvider } from "./DocumentStoreProvider.js";
import { ElementRenderer } from "./ElementRenderer.js";

/**
 * Used in editing mode: fetches a fresh copy of the page from the SDK,
 * then mounts a DocumentStoreProvider + ElementRenderer for it.
 *
 * Equivalent of the React ConnectToEditor component.
 */
export const ConnectToEditor = defineComponent({
    name: "WebinyConnectToEditor",

    props: {
        document: { type: Object as PropType<Document>, required: true },
        components: { type: Array as PropType<Component[]>, required: true }
    },

    setup(props) {
        const data = ref<Document | null>(null);

        onMounted(() => {
            contentSdk.getPage(props.document.properties.path).then(doc => {
                data.value = doc;
            });
        });

        return () => {
            if (!data.value) {return null;}

            return h(
                DocumentStoreProvider,
                { id: data.value.properties.id, document: data.value },
                { default: () => h(ElementRenderer, { id: "root" }) }
            );
        };
    }
});
