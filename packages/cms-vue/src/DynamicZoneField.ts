import { computed, defineComponent, h, type Component as VueComponent } from "vue";
import { ComponentRegistry, ComponentResolver } from "@webiny/cms-sdk";
import { useComponents, useModel } from "./EntryRenderer.js";

/**
 * Renders a dynamic zone value with the components passed to the closest `EntryRenderer`.
 * Pass a value read from `useEntry()` so it updates during live preview.
 */
export const DynamicZoneField = defineComponent({
    name: "WebinyDynamicZoneField",
    props: {
        value: { type: null, default: undefined }
    },
    setup(props) {
        const components = useComponents();
        const model = useModel();

        const registry = computed(() => {
            const registry = new ComponentRegistry();
            for (const component of components.value) {
                registry.register(component);
            }
            return registry;
        });

        return () => {
            if (!model.value || !props.value) {
                return null;
            }

            const items = Array.isArray(props.value) ? props.value : [props.value];
            const resolver = new ComponentResolver(registry.value);
            const resolved = resolver.resolve(items, model.value);

            return resolved.map((item, index) =>
                h(item.component as VueComponent, {
                    ...item.props,
                    key: `${item.templateId}-${index}`
                })
            );
        };
    }
});
