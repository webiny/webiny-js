import type {
    Component,
    ComponentInput,
    ComponentManifest,
    ComponentManifestInput,
    InputFactory
} from "@webiny/website-builder-sdk";
import { createSlotInput } from "@webiny/website-builder-sdk";
import type { ExtractInputs } from "~/types.js";

export function createComponent<
    TComponent extends (props: any) => any,
    TInputs extends ExtractInputs<Parameters<TComponent>[0]>
>(component: TComponent, manifest: ComponentManifestInput<TInputs>): Component {
    const inputs: ComponentInput[] = [];

    // Normalize inputs to always be an array of objects.

    if (Array.isArray(manifest.inputs)) {
        inputs.push(...manifest.inputs);
    } else {
        const inputsObject: Record<string, InputFactory<any>> = manifest.inputs ?? {};
        Object.keys(inputsObject).forEach((name: string) => {
            inputs.push({ ...inputsObject[name], name });
        });
    }

    const acceptsChildren = manifest.acceptsChildren;

    if (acceptsChildren) {
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
