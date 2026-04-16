import { defineComponent, type PropType } from "vue";
import type { Slot } from "vue";

/**
 * Declarative fragment marker — analogous to the React DocumentFragment
 * component but implemented differently in Vue.
 *
 * Usage inside a <DocumentRenderer>:
 *
 * ```vue
 * <DocumentRenderer :document="doc" :components="comps">
 *   <!-- Inject a Vue subtree into the 'header' named fragment slot -->
 *   <template #fragment:header>
 *     <MySiteHeader />
 *   </template>
 * </DocumentRenderer>
 * ```
 *
 * For component-type fragments pass a `fragments` prop directly to
 * DocumentRenderer instead:
 * ```ts
 * const fragments = [{ type: "component", component: "Webiny/MyNav", inputs: {} }];
 * ```
 */
export type DocumentFragmentProps =
    | { name: string; element: Slot; component?: never; inputs?: never }
    | { component: string; inputs?: Record<string, unknown>; name?: never; element?: never };

export const DocumentFragment = defineComponent({
    name: "WebinyDocumentFragment",
    props: {
        name: { type: String, default: undefined },
        component: { type: String, default: undefined },
        inputs: {
            type: Object as PropType<Record<string, unknown>>,
            default: undefined
        }
    },
    setup(_, { slots }) {
        // If used directly in a template, render the default slot.
        return () => slots.default?.() ?? null;
    }
});
