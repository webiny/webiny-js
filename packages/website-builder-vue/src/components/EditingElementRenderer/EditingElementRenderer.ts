import { defineComponent, onUnmounted, watch, h, type PropType } from "vue";
import { type DocumentElement } from "@webiny/website-builder-sdk";
import { EditingElementRendererPresenter } from "./EditingElementRenderer.presenter.js";
import { LiveElementRenderer } from "../LiveElementRenderer.js";
import { useElementSlotDepth } from "../ElementSlotDepthProvider.js";
import { useElementIndex } from "../ElementIndexProvider.js";
import { useDocumentStore } from "../DocumentStoreProvider.js";
import { useObservable } from "~/composables/useObservable.js";

/**
 * Wraps LiveElementRenderer with data-* attributes consumed by the Webiny
 * editor (depth, sibling index, parent element ID/slot).
 *
 * Also sets up an EditingElementRendererPresenter that listens for element
 * patch messages from the editor iframe and applies them to the document store.
 */
export const EditingElementRenderer = defineComponent({
    name: "WebinyEditingElementRenderer",

    props: {
        element: { type: Object as PropType<DocumentElement>, required: true }
    },

    setup(props) {
        const documentStore = useDocumentStore();
        const depth = useElementSlotDepth();
        const index = useElementIndex();

        const presenter = new EditingElementRendererPresenter(documentStore);

        // Initialise the presenter when the element (or its ID) changes.
        const stopWatch = watch(
            () => props.element?.id,
            () => {
                if (props.element) {
                    presenter.init(props.element);
                }
            },
            { immediate: true }
        );

        onUnmounted(() => {
            presenter.dispose();
            stopWatch();
        });

        // Bridge the presenter's MobX observable vm into a Vue reactive ref.
        const vm = useObservable(() => presenter.vm);

        return () => {
            const element = vm.value?.element;
            if (!element?.id) {
                return null;
            }

            return h(
                "div",
                {
                    style: { display: "contents" },
                    "data-element-id": element.id,
                    "data-depth": depth,
                    "data-parent-index": index,
                    "data-parent-id": element.parent?.id,
                    "data-parent-slot": element.parent?.slot
                },
                [h(LiveElementRenderer, { element })]
            );
        };
    }
});
