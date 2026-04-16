import { defineComponent, provide, inject, h, type InjectionKey, type PropType } from "vue";

const DEPTH_KEY: InjectionKey<number> = Symbol("WebinyElementSlotDepth");

/**
 * Provides the current element-slot nesting depth to all descendants.
 */
export const ElementSlotDepthProvider = defineComponent({
    name: "WebinyElementSlotDepthProvider",

    props: {
        depth: { type: Number as PropType<number>, required: true }
    },

    setup(props, { slots }) {
        provide(DEPTH_KEY, props.depth);
        return () => slots.default?.();
    }
});

/** Returns the current slot nesting depth (0 at the root). */
export const useElementSlotDepth = (): number => {
    return inject(DEPTH_KEY, 0);
};
