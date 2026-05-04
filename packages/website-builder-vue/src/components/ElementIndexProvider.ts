import { defineComponent, provide, inject, type InjectionKey, type PropType } from "vue";

const INDEX_KEY: InjectionKey<number> = Symbol("WebinyElementIndex");

/**
 * Provides the sibling index of the current element to all descendants.
 */
export const ElementIndexProvider = defineComponent({
    name: "WebinyElementIndexProvider",

    props: {
        index: { type: Number as PropType<number>, required: true }
    },

    setup(props, { slots }) {
        provide(INDEX_KEY, props.index);
        return () => slots.default?.();
    }
});

/** Returns the sibling index of the current element (0-based). */
export const useElementIndex = (): number => {
    return inject(INDEX_KEY, 0);
};
