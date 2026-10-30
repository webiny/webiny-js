import {
    computed,
    defineComponent,
    h,
    inject,
    provide,
    toRef,
    type InjectionKey,
    type PropType,
    type Ref
} from "vue";
import { componentRegistry, contentSdk, refCache } from "@webiny/cms-sdk";
import type { CmsEntry, CmsModelDefinition, Component, EntryStoreConfig } from "@webiny/cms-sdk";
import { EntryStoreProvider } from "./EntryStoreProvider.js";
import { ConnectToEntryEditor } from "./ConnectToEntryEditor.js";

const COMPONENTS_KEY: InjectionKey<Ref<Component[]>> = Symbol("WebinyCmsComponents");
const MODEL_KEY: InjectionKey<Ref<CmsModelDefinition | null>> = Symbol("WebinyCmsModel");

export const useComponents = (): Ref<Component[]> => {
    return inject(
        COMPONENTS_KEY,
        computed(() => [])
    );
};

export const useModel = (): Ref<CmsModelDefinition | null> => {
    return inject(
        MODEL_KEY,
        computed(() => null)
    );
};

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

        provide(COMPONENTS_KEY, toRef(props, "components"));
        provide(
            MODEL_KEY,
            computed(() => props.model)
        );

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
                const entryId = props.entry ? props.entry.entryId : getEntryIdFromUrl();
                return h(
                    ConnectToEntryEditor,
                    {
                        modelId: props.model.modelId,
                        entryId,
                        storeConfig: storeConfig.value
                    },
                    slots
                );
            }

            if (!props.entry) {
                return null;
            }

            return h(
                EntryStoreProvider,
                {
                    entryId: props.entry.entryId,
                    entry: props.entry,
                    storeConfig: storeConfig.value
                },
                slots
            );
        };
    }
});

function getEntryIdFromUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get("wb.id") || "";
}
