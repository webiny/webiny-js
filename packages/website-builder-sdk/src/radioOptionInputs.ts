import {
    ComponentManifestToAstConverter,
    RADIO_VALUE_INPUT,
    type InputAstNode
} from "./ComponentManifestToAstConverter.js";

/**
 * Whether the node is a radio whose options carry inputs, i.e. an object node with a `value` child
 * (see `ComponentManifestToAstConverter`).
 */
export function hasRadioOptionInputs(node: InputAstNode): boolean {
    return node.input.type === "radio" && node.type === "object";
}

/**
 * The child node that stores the selected option of a radio with option inputs.
 */
export function getRadioValueNode(node: InputAstNode): InputAstNode | undefined {
    return node.children.find(child => child.name === RADIO_VALUE_INPUT);
}

/**
 * The selected option of a radio with option inputs: the stored `value` of the radio object, or its default.
 * Pass the radio's value resolved for the active breakpoint (the renderer's `value`), so a breakpoint
 * override of the selection is shown.
 */
export function getSelectedRadioValue(
    node: InputAstNode,
    radioValue: Record<string, unknown> | undefined
): string | undefined {
    const valueNode = getRadioValueNode(node);
    if (!valueNode) {
        return undefined;
    }
    const stored = radioValue?.[RADIO_VALUE_INPUT];
    return (stored ?? valueNode.input.defaultValue) as string | undefined;
}

/**
 * The nodes of one option's inputs, with that option's definitions, at the radio's shared paths.
 */
export function getRadioOptionNodes(node: InputAstNode, optionValue: string | undefined) {
    if (optionValue === undefined) {
        return [];
    }
    return ComponentManifestToAstConverter.convertRadioOptionInputs(node, optionValue);
}

/**
 * The radio object's next value with another option selected; the option inputs keep their values.
 */
export function withRadioValue(
    current: Record<string, unknown> | undefined,
    optionValue: string
): Record<string, unknown> {
    return { ...current, [RADIO_VALUE_INPUT]: optionValue };
}
