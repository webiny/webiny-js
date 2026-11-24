import { defineComponent } from "vue";
import { h } from "vue";
import type { PropType } from "vue";
import type { CmsEntry } from "@webiny/cms-sdk";
import type { EntryStoreConfig } from "@webiny/cms-sdk";
import { EntryStoreScope } from "./EntryStoreScope.js";

export const EntryStoreProvider = defineComponent({
    name: "WebinyEntryStoreProvider",
    props: {
        entryId: { type: String, required: true },
        entry: { type: Object as PropType<CmsEntry>, default: undefined },
        storeConfig: { type: Object as PropType<EntryStoreConfig>, default: undefined }
    },
    setup(props, { slots }) {
        return () => {
            const scopeProps = {
                key: props.entryId,
                entryId: props.entryId,
                entry: props.entry,
                storeConfig: props.storeConfig
            };
            return h(EntryStoreScope, scopeProps, slots);
        };
    }
});
