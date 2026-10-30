import { defineComponent, h, onMounted, shallowRef, watch, type PropType } from "vue";
import { contentSdk, type CmsEntry, type EntryStoreConfig } from "@webiny/cms-sdk";
import { EntryStoreProvider } from "./EntryStoreProvider.js";

export const ConnectToEntryEditor = defineComponent({
    name: "WebinyConnectToEntryEditor",
    props: {
        modelId: { type: String, required: true },
        entryId: { type: String, required: true },
        storeConfig: { type: Object as PropType<EntryStoreConfig>, default: undefined }
    },
    setup(props, { slots }) {
        const entry = shallowRef<CmsEntry | null>(null);

        const load = () => {
            contentSdk.getEntry({ modelId: props.modelId, entryId: props.entryId }).then(result => {
                if (result) {
                    entry.value = result;
                }
            });
        };

        // The entry is loaded in the browser only: the editor drives it over postMessage.
        onMounted(() => {
            load();
            watch(() => [props.modelId, props.entryId], load);
        });

        return () => {
            if (!entry.value) {
                return null;
            }

            return h(
                EntryStoreProvider,
                {
                    entryId: props.entryId,
                    entry: entry.value,
                    storeConfig: props.storeConfig
                },
                slots
            );
        };
    }
});
