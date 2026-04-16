import {
    defineComponent,
    provide,
    inject,
    watch,
    h,
    type InjectionKey,
    type PropType,
    type Slot
} from "vue";
import { contentSdk } from "@webiny/website-builder-sdk";

/**
 * A fragment that renders a pre-defined Vue subtree (fixed).
 * `element` is a Vue slot function returned by useSlots() — e.g. the result
 * of `<template #fragment:header>…</template>` in the consumer.
 */
type FixedFragment = {
    type: "fixed";
    name: string;
    element: Slot;
};

/**
 * A fragment that inserts a named editor component with given inputs.
 */
type ComponentFragment = {
    type: "component";
    component: string;
    inputs: Record<string, unknown>;
};

export type DocumentFragmentConfig = FixedFragment | ComponentFragment;
export type DocumentFragments = DocumentFragmentConfig[];

const FRAGMENTS_KEY: InjectionKey<() => DocumentFragments> = Symbol("WebinyDocumentFragments");

/**
 * Provides the fragments array to all descendants and notifies the editing
 * SDK whenever the fragment list changes.
 */
export const FragmentsProvider = defineComponent({
    name: "WebinyFragmentsProvider",

    props: {
        fragments: {
            type: Array as PropType<DocumentFragments>,
            default: () => []
        }
    },

    setup(props, { slots }) {
        // Notify the editing SDK when fragments change.
        watch(
            () => props.fragments.length,
            () => {
                if (!contentSdk.isEditing()) return;

                const data = props.fragments.map(f => {
                    if (f.type === "fixed") return { type: "fixed", name: f.name };
                    return { type: "component", component: f.component, inputs: f.inputs };
                });

                contentSdk.getEditingSdk()?.messenger.send("document.fragments", {
                    fragments: data
                });
            }
        );

        // Provide as a getter so consumers always receive the latest array.
        provide(FRAGMENTS_KEY, () => props.fragments);

        return () => slots.default?.();
    }
});

/**
 * Composable – returns the current DocumentFragments array.
 * Returns an empty array when called outside a FragmentsProvider.
 */
export const useDocumentFragments = (): DocumentFragments => {
    const get = inject(FRAGMENTS_KEY, () => [] as DocumentFragments);
    return get();
};
