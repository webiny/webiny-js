import type {
    Component,
    ComponentInput,
    ComponentManifest,
    ComponentManifestInput,
    InputFactory
} from "@webiny/website-builder-sdk";
import { createSlotInput } from "@webiny/website-builder-sdk";
import type { ExtractInputs } from "~/types.js";

/**
 * Wraps a Vue component with a Webiny Website Builder manifest so it can be
 * registered with the SDK and rendered inside a DocumentRenderer.
 *
 * Usage:
 * ```ts
 * import { createComponent, createTextInput } from "@webiny/website-builder-vue";
 *
 * const MyBanner = (props: ComponentProps<{ headline: string }>) =>
 *     h("div", props.inputs.headline);
 *
 * export const Banner = createComponent(MyBanner, {
 *     name: "My/Banner",
 *     label: "Banner",
 *     inputs: { headline: createTextInput({ label: "Headline" }) }
 * });
 * ```
 */
export function createComponent<
    TComponent extends (props: any) => any,
    TInputs extends ExtractInputs<Parameters<TComponent>[0]>
>(component: TComponent, manifest: ComponentManifestInput<TInputs>): Component {
    const inputs: ComponentInput[] = [];

    if (Array.isArray(manifest.inputs)) {
        inputs.push(...manifest.inputs);
    } else {
        const inputsObject: Record<string, InputFactory<any>> = manifest.inputs ?? {};
        Object.keys(inputsObject).forEach((name: string) => {
            inputs.push({ ...inputsObject[name], name });
        });
    }

    if (manifest.acceptsChildren) {
        const hasChildren = inputs.some(input => input.name === "children");
        if (!hasChildren) {
            inputs.push(createSlotInput({ name: "children" }));
        }
    }

    return {
        component,
        manifest: { ...manifest, tags: manifest.tags ?? [], inputs } as ComponentManifest
    };
}
