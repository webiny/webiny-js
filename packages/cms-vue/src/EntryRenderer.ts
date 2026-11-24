import { computed } from "vue";
import { defineComponent } from "vue";
import { h } from "vue";
import { provide } from "vue";
import { toRef } from "vue";
import type { PropType } from "vue";
import { componentRegistry } from "@webiny/cms-sdk";
import { contentSdk } from "@webiny/cms-sdk";
import { refCache } from "@webiny/cms-sdk";
import type { CmsEntry } from "@webiny/cms-sdk";
import type { CmsModelDefinition } from "@webiny/cms-sdk";
import type { Component } from "@webiny/cms-sdk";
import type { EntryStoreConfig } from "@webiny/cms-sdk";
import { EntryStoreProvider } from "./EntryStoreProvider.js";
import { ConnectToEntryEditor } from "./ConnectToEntryEditor.js";
import { COMPONENTS_KEY } from "./injectionKeys.js";
import { MODEL_KEY } from "./injectionKeys.js";

/**
 * Renders a CMS entry. Outside the editor it provides `entry` to its default slot's
 * descendants (`useEntry`, `DynamicZoneField`, `RefField`). Inside the CMS live preview it
 * loads the entry in the browser and keeps it in sync with the editor.
 */
export const EntryRenderer = defineComponent({
    name: "WebinyEntryRenderer",
    props: {
        entry: { type: Object as PropType<CmsEntry | null>, default: null },
        model: { type: Object as PropType<CmsModelDefinition>, required: true },
        components: { type: Array as PropType<Component[]>, default: () => [] }
    },
    setup(props, { slots }) {
        refCache.setResolver(contentSdk);

        const components = toRef(props, "components");
        const model = computed((): CmsModelDefinition | null => props.model);
        provide(COMPONENTS_KEY, components);
        provide(MODEL_KEY, model);

        const storeConfig = computed((): EntryStoreConfig => {
            const refModels = props.model.metadata?.refModels;
            if (!refModels || Object.keys(refModels).length === 0) {
                return {};
            }
            return {
                refModels,
                refResolver: contentSdk
            };
        });

        return () => {
            props.components.forEach(c => componentRegistry.register(c));

            if (contentSdk.isEditing()) {
                const editorProps = {
                    modelId: props.model.modelId,
                    entryId: props.entry ? props.entry.entryId : getEntryIdFromUrl(),
                    storeConfig: storeConfig.value
                };
                return h(ConnectToEntryEditor, editorProps, slots);
            }

            if (!props.entry) {
                return null;
            }

            const providerProps = {
                entryId: props.entry.entryId,
                entry: props.entry,
                storeConfig: storeConfig.value
            };
            return h(EntryStoreProvider, providerProps, slots);
        };
    }
});

function getEntryIdFromUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get("wb.id") || "";
}
