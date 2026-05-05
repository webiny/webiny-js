import { defineComponent, computed, h, type PropType } from "vue";
import { contentSdk, type Component, type Document } from "@webiny/website-builder-sdk";
import { DocumentStoreProvider } from "./DocumentStoreProvider.js";
import { ConnectToEditor } from "./ConnectToEditor.js";
import { FragmentsProvider, type DocumentFragmentConfig } from "./FragmentsProvider.js";
import { ElementRenderer } from "./ElementRenderer.js";
import { editorComponents } from "~/editorComponents/index.js";

/**
 * Top-level rendering component. Accepts a Webiny document and a list of
 * custom components, then renders the full page tree.
 *
 * **Named-slot fragments**
 *
 * Inject app-level Vue subtrees into named fragment slots:
 * ```vue
 * <DocumentRenderer :document="page.document" :components="myComps">
 *   <template #fragment:header><MySiteHeader /></template>
 *   <template #fragment:footer><MySiteFooter /></template>
 * </DocumentRenderer>
 * ```
 *
 * **Component fragments** (reference built-in editor components by name):
 * ```ts
 * const fragments = [
 *   { type: "component", component: "Webiny/MyNav", inputs: { label: "Nav" } }
 * ];
 * ```
 */
export const DocumentRenderer = defineComponent({
    name: "WebinyDocumentRenderer",

    props: {
        document: {
            type: Object as PropType<Document | null>,
            default: null
        },
        components: {
            type: Array as PropType<Component[]>,
            default: () => []
        },
        /** Additional fragment configs (component-type or pre-built fixed fragments). */
        fragments: {
            type: Array as PropType<DocumentFragmentConfig[]>,
            default: () => []
        }
    },

    setup(props, { slots }) {
        // Collect named slot fragments: <template #fragment:header> etc.
        const slotFragments = computed((): DocumentFragmentConfig[] =>
            Object.entries(slots)
                .filter(([name]) => name.startsWith("fragment:"))
                .map(
                    ([name, slot]): DocumentFragmentConfig => ({
                        type: "fixed",
                        name: name.slice("fragment:".length),
                        element: slot!
                    })
                )
        );

        const allFragments = computed(() => [...slotFragments.value, ...props.fragments]);

        return () => {
            const { document, components } = props;

            // Register all components with the SDK on every render (idempotent).
            const allComponents = [...editorComponents, ...components];
            allComponents.forEach(c => contentSdk.registerComponent(c));

            if (!document && !contentSdk.isEditing()) {
                return h("div", { "data-role": "document-renderer" }, slots.default?.());
            }

            return h("div", { "data-role": "document-renderer" }, [
                h(
                    FragmentsProvider,
                    { fragments: allFragments.value },
                    {
                        default: () =>
                            contentSdk.isEditing()
                                ? h(ConnectToEditor, {
                                      document: document ?? undefined,
                                      components
                                  })
                                : h(
                                      DocumentStoreProvider,
                                      {
                                          id: document!.properties.id,
                                          document: document!
                                      },
                                      {
                                          default: () => h(ElementRenderer, { id: "root" })
                                      }
                                  )
                    }
                )
            ]);
        };
    }
});
