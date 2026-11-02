import { defineComponent, ref, computed, watch, onMounted, h, Fragment, type PropType } from "vue";
import { contentSdk, type DocumentElement, type ComponentInput } from "@webiny/website-builder-sdk";
import { ElementSlot } from "./ElementSlot.js";
import { useViewport } from "~/composables/useViewport.js";
import { useBindingsForElement } from "~/composables/useBindingsForElement.js";
import { useDocumentState } from "~/composables/useDocumentState.js";
import { useDocumentStore } from "~/components/DocumentStoreProvider.js";
import { useMobxTracking } from "~/composables/useMobxTracking.js";
import { pickDeclaredProps } from "./pickDeclaredProps.js";

/**
 * Resolves a single document element into its rendered Vue subtree.
 *
 * Steps:
 *  1. Determines the current breakpoint (starts at "desktop" for SSR safety).
 *  2. Fetches merged bindings for the element at that breakpoint.
 *  3. Calls contentSdk.resolveElement() to get the list of component instances.
 *  4. Renders each instance, optionally wrapping it in a style div.
 */
export const LiveElementRenderer = defineComponent({
    name: "WebinyLiveElementRenderer",

    props: {
        element: { type: Object as PropType<DocumentElement>, required: true }
    },

    setup(props) {
        const viewport = useViewport();

        // Start with "desktop" on both server and initial client render (SSR-safe).
        const breakpoint = ref<string>("desktop");

        onMounted(() => {
            if (viewport.value?.breakpoint) {
                breakpoint.value = viewport.value.breakpoint;
            }
        });

        watch(
            () => viewport.value?.breakpoint,
            newBp => {
                if (newBp && newBp !== breakpoint.value) {
                    breakpoint.value = newBp;
                }
            }
        );

        const elementId = computed(() => props.element?.id ?? "");
        const elementBindings = useBindingsForElement(elementId.value, breakpoint);
        const state = useDocumentState();
        const documentStore = useDocumentStore();
        // `resolveElement` reads MobX state, such as content entries that `contentEntryCache`
        // fetches in the editor. Track those reads so the element re-renders when they change.
        const mobx = useMobxTracking("WebinyLiveElementRenderer");

        return () => {
            // Subscribes this render function to the MobX reaction.
            void mobx.version.value;

            const { element } = props;
            if (!element?.component) {
                return null;
            }

            const onResolved = (value: unknown, input: ComponentInput) => {
                if (input.type === "slot") {
                    const elements = (input as { list?: boolean }).list
                        ? (value as string[])
                        : [value as string];
                    return h(ElementSlot, {
                        parentId: element.id,
                        slot: input.name,
                        elements
                    });
                }
                return value;
            };

            const doc = documentStore.getDocument();

            const params = {
                element,
                state: state.value,
                elementBindings: elementBindings.value,
                cache: doc?.__cache,
                onResolved
            };
            const instances = mobx.track(() => contentSdk.resolveElement(params));

            if (!instances) {
                return null;
            }

            const vnodes = instances.map((resolved, index) => {
                const { component: Component, inputs, styles, manifest } = resolved;
                const autoApplyStyles = manifest.autoApplyStyles !== false;

                const rendererProps = pickDeclaredProps(Component, {
                    inputs,
                    styles,
                    element,
                    breakpoint: breakpoint.value
                });
                const userVNode = h(Component, {
                    key: `${element.id}-${index}`,
                    ...rendererProps
                });

                if (!autoApplyStyles) {
                    return userVNode;
                }

                return h("div", { key: `wrapper-${index}`, style: styles }, [userVNode]);
            });

            return h(Fragment, null, vnodes);
        };
    }
});
