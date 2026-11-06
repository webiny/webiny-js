import { computed } from "vue";
import { defineComponent } from "vue";
import { h } from "vue";
import type { Component as VueComponent } from "vue";
import { ComponentRegistry } from "@webiny/cms-sdk";
import { ComponentResolver } from "@webiny/cms-sdk";
import { useComponents } from "./useComponents.js";
import { useModel } from "./useModel.js";

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

            return resolved.map((item, index) => {
                const component = item.component as VueComponent;
                const props = { ...item.props, key: `${item.templateId}-${index}` };
                return h(component, props);
            });
        };
    }
});
