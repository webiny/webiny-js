import { defineComponent, h } from "vue";
import { environment } from "@webiny/website-builder-sdk";
import { EditingElementRenderer } from "./EditingElementRenderer/index.js";
import { LiveElementRenderer } from "./LiveElementRenderer.js";
import { useDocumentStore } from "./DocumentStoreProvider.js";
import { useObservable } from "~/composables/useObservable.js";
import { setElementRenderer } from "./LiveElementSlot.js";

/**
 * Entry point for rendering a single document element by ID.
 *
 * - Retrieves the live element from the MobX DocumentStore (reactive via useObservable).
 * - Dispatches to EditingElementRenderer (editor mode) or LiveElementRenderer (live mode).
 */
export const ElementRenderer = defineComponent({
    name: "WebinyElementRenderer",

    props: {
        id: { type: String, required: true }
    },

    setup(props) {
        const documentStore = useDocumentStore();

        // Reactively track the element in the MobX store.
        const element = useObservable(() => documentStore.getElement(props.id));

        return () => {
            if (!element.value) {return null;}

            if (environment.isEditing()) {
                return h(EditingElementRenderer, { element: element.value });
            }
            return h(LiveElementRenderer, { element: element.value });
        };
    }
});

// Break the circular dependency: LiveElementSlot needs ElementRenderer.
setElementRenderer(ElementRenderer);
