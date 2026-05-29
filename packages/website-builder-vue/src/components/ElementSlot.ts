import { defineComponent, h, type PropType } from "vue";
import { environment } from "@webiny/website-builder-sdk";
import { LiveElementSlot } from "./LiveElementSlot.js";
import { PreviewElementSlot } from "./PreviewElementSlot.js";

/**
 * Dispatches to PreviewElementSlot (editing mode) or LiveElementSlot (live
 * mode) based on the current environment.
 *
 * Used by LiveElementRenderer when resolving slot inputs so that child elements
 * are rendered recursively via ElementRenderer.
 */
export const ElementSlot = defineComponent({
    name: "WebinyElementSlot",

    props: {
        parentId: { type: String, required: true },
        slot: { type: String, required: true },
        elements: { type: Array as PropType<string[]>, default: () => [] }
    },

    setup(props) {
        return () => {
            if (environment.isEditing()) {
                return h(PreviewElementSlot, {
                    parentId: props.parentId,
                    slot: props.slot,
                    elements: props.elements
                });
            }
            return h(LiveElementSlot, { elements: props.elements });
        };
    }
});
