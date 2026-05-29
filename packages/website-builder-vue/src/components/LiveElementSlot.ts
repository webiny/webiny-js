import { defineComponent, h, type PropType } from "vue";
import { ElementSlotDepthProvider, useElementSlotDepth } from "./ElementSlotDepthProvider.js";
import { ElementIndexProvider } from "./ElementIndexProvider.js";
import { setLiveElementSlot } from "./PreviewElementSlot.js";

// Forward-declared to resolve the circular ElementRenderer ↔ LiveElementSlot cycle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ElementRenderer: any;
export const setElementRenderer = (c: unknown) => {
    ElementRenderer = c;
};

/**
 * Renders a flat list of element IDs as sibling ElementRenderer instances,
 * each wrapped in an index-provider and nested inside an incremented depth.
 */
export const LiveElementSlot = defineComponent({
    name: "WebinyLiveElementSlot",

    props: {
        elements: { type: Array as PropType<string[]>, default: () => [] }
    },

    setup(props) {
        const depth = useElementSlotDepth();

        return () =>
            h(
                ElementSlotDepthProvider,
                { depth: depth + 1 },
                {
                    default: () =>
                        props.elements.map((id, index) =>
                            h(
                                ElementIndexProvider,
                                { key: id, index },
                                { default: () => h(ElementRenderer, { id }) }
                            )
                        )
                }
            );
    }
});

// Break the circular dependency: PreviewElementSlot needs LiveElementSlot.
setLiveElementSlot(LiveElementSlot);
