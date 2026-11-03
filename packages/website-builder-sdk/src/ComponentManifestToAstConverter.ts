import type { ComponentInput, RadioInput, RadioOption, ResolvedInputRenderer } from "./types.js";

export type InputAstNode = {
    name: string;
    type: string;
    list: boolean;
    path: string;
    children: InputAstNode[];
    input: ComponentInput;
    /**
     * The input's renderer in one shape, whichever form the manifest used (`"Webiny/Input"` or
     * `{ name, settings }`). Read the renderer from here, not from `input.renderer`.
     */
    renderer: ResolvedInputRenderer;
};

/**
 * The input's renderer as an object: a plain name gets empty settings, a missing renderer an empty
 * name (the sidebar then shows "Missing renderer").
 */
function resolveInputRenderer(input: Pick<ComponentInput, "renderer">): ResolvedInputRenderer {
    const renderer = input.renderer;
    if (!renderer) {
        return { name: "", settings: {} };
    }
    if (typeof renderer === "string") {
        return { name: renderer, settings: {} };
    }
    return { name: renderer.name ?? "", settings: renderer.settings ?? {} };
}

/**
 * The name of the child that holds the selected option of a radio with option inputs.
 */
export const RADIO_VALUE_INPUT = "value";

/**
 * The properties that copies of an option input (the same name in several options) must agree on,
 * because they are one stored value.
 */
const SHARED_OPTION_INPUT_KEYS = ["type", "list", "translatable", "defaultValue"] as const;

const isDevelopment = () => {
    return typeof process === "undefined" || process.env?.NODE_ENV !== "production";
};

const isRadioWithOptionInputs = (input: ComponentInput): input is RadioInput => {
    if (input.type !== "radio") {
        return false;
    }
    const options = (input as RadioInput).options ?? [];
    return options.some(option => Array.isArray(option.inputs) && option.inputs.length > 0);
};

export class ComponentManifestToAstConverter {
    static convert(inputs: ComponentInput[]): InputAstNode[] {
        return this.buildAst(inputs);
    }

    /**
     * Returns the AST nodes of one option's inputs, at the radio node's paths, with that option's
     * definitions (labels, validation). Renderers draw the selected option's inputs with these.
     * The paths are the same as those of the radio's merged children, so values are shared.
     */
    static convertRadioOptionInputs(radioNode: InputAstNode, optionValue: string): InputAstNode[] {
        const input = radioNode.input as RadioInput;
        const option = (input.options ?? []).find(option => option.value === optionValue);
        if (!option?.inputs) {
            return [];
        }
        return this.buildAst(option.inputs, radioNode.path);
    }

    private static buildAst(inputs: ComponentInput[], basePath = ""): InputAstNode[] {
        return inputs.map(input => {
            const path = basePath ? `${basePath}/${input.name}` : input.name;
            const node: InputAstNode = {
                name: input.name,
                type: input.type,
                list: input.list || false,
                path,
                children: [],
                input,
                renderer: resolveInputRenderer(input)
            };

            if (input.type === "object" && input.fields) {
                node.children = this.buildAst(input.fields, path);
            } else if (isRadioWithOptionInputs(input)) {
                // A radio whose options carry inputs is stored as an object: `value` holds the
                // selected option, the options' inputs (merged by name) are the other children.
                node.type = "object";
                node.children = this.buildAst(this.getRadioChildInputs(input), path);
            }

            return node;
        });
    }

    private static getRadioChildInputs(input: RadioInput): ComponentInput[] {
        const options: RadioOption[] = input.options.map(option => {
            const { inputs: _inputs, ...rest } = option;
            return rest;
        });

        const valueInput: RadioInput = {
            name: RADIO_VALUE_INPUT,
            type: "radio",
            label: input.label,
            renderer: input.renderer,
            defaultValue: input.defaultValue,
            required: input.required,
            responsive: input.responsive,
            options
        };

        const merged = new Map<string, { input: ComponentInput; option: string }>();
        for (const option of input.options) {
            for (const optionInput of option.inputs ?? []) {
                const existing = merged.get(optionInput.name);
                if (!existing) {
                    merged.set(optionInput.name, { input: optionInput, option: option.value });
                    continue;
                }
                if (isDevelopment()) {
                    this.assertSameStoredValue(input, existing, {
                        input: optionInput,
                        option: option.value
                    });
                }
            }
        }

        if (merged.has(RADIO_VALUE_INPUT)) {
            throw new Error(
                `Radio input "${input.name}": an option input can't be named "${RADIO_VALUE_INPUT}", the name of the selected option.`
            );
        }

        return [valueInput, ...Array.from(merged.values()).map(entry => entry.input)];
    }

    private static assertSameStoredValue(
        radio: RadioInput,
        first: { input: ComponentInput; option: string },
        other: { input: ComponentInput; option: string }
    ) {
        for (const key of SHARED_OPTION_INPUT_KEYS) {
            const a = normalizeSharedValue(key, first.input[key]);
            const b = normalizeSharedValue(key, other.input[key]);
            if (JSON.stringify(a) !== JSON.stringify(b)) {
                throw new Error(
                    `Radio input "${radio.name}": option input "${other.input.name}" has a different "${key}" in options "${first.option}" and "${other.option}". Inputs with the same name share one stored value, so they must agree on ${SHARED_OPTION_INPUT_KEYS.join(", ")}.`
                );
            }
        }
    }
}

function normalizeSharedValue(key: string, value: unknown) {
    if (key === "list" || key === "translatable") {
        return Boolean(value);
    }
    return value;
}
