import type { ComponentManifest } from "@webiny/website-builder-sdk";

/**
 * The Website Builder components a model may place, with what it needs to fill them in. A component
 * opts out with `useInAiContentGeneration: false`. Used by the one-shot page generator and by the
 * assistant's page editor tools, so both offer the model the same catalog.
 */
export const aiComponentCatalog = (components: ComponentManifest[]) => {
    return components
        .filter(component => component.useInAiContentGeneration !== false)
        .map(component => ({
            name: component.name,
            label: component.label,
            aiContext: component.aiContext,
            inputs: component.inputs.map(input => ({
                type: input.type,
                name: input.name,
                label: input.label,
                description: input.description
            }))
        }));
};
