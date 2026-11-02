import { defineComponent } from "vue";
import { h } from "vue";
import { onMounted } from "vue";
import { shallowRef } from "vue";
import { watch } from "vue";
import type { PropType } from "vue";
import { contentSdk } from "@webiny/cms-sdk";
import type { CmsEntry } from "@webiny/cms-sdk";
import type { EntryStoreConfig } from "@webiny/cms-sdk";
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
        // Bumped on every load, so a response for an earlier entry is dropped.
        let request = 0;

        const load = () => {
            request++;
            const current = request;
            const params = { modelId: props.modelId, entryId: props.entryId };

            contentSdk
                .getEntry(params)
                .then(result => {
                    if (current === request && result) {
                        entry.value = result;
                    }
                })
                .catch(error => {
                    console.error(
                        `Failed to load entry "${params.entryId}" for live preview.`,
                        error
                    );
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

            const providerProps = {
                entryId: props.entryId,
                entry: entry.value,
                storeConfig: props.storeConfig
            };
            return h(EntryStoreProvider, providerProps, slots);
        };
    }
});
