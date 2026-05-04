import { defineComponent, h, type PropType } from "vue";
import { useElementSlotDepth } from "./ElementSlotDepthProvider.js";

// Forward-declare to avoid circular dep at module init time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LiveElementSlot: any;
export const setLiveElementSlot = (c: unknown) => {
    LiveElementSlot = c;
};

/**
 * In editing mode, renders an empty placeholder div when the slot has no
 * children (so the editor can show a drop zone).  Otherwise delegates to
 * LiveElementSlot.
 */
export const PreviewElementSlot = defineComponent({
    name: "WebinyPreviewElementSlot",

    props: {
        parentId: { type: String, required: true },
        slot: { type: String, required: true },
        elements: { type: Array as PropType<string[]>, default: () => [] }
    },

    setup(props) {
        const depth = useElementSlotDepth();

        return () => {
            if (!props.elements.length) {
                return h("div", {
                    style: { height: "100px", width: "100% !important" },
                    "data-role": "element-slot",
                    "data-parent-id": props.parentId,
                    "data-parent-slot": props.slot,
                    "data-depth": depth,
                    "data-empty": true
                });
            }

            return h(LiveElementSlot, { elements: props.elements });
        };
    }
});
