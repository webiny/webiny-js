import { useCallback, useMemo, useState } from "react";
import { toJS } from "mobx";
import set from "lodash/set.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils/generateId.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { ValueBinding, CreateElementParams } from "@webiny/website-builder-sdk";
import { Commands } from "~/BaseEditor/index.js";
import type { InputAstNode } from "@webiny/website-builder-sdk";
import {
    BindingsProcessor,
    functionConverter,
    InputsBindingsProcessor,
    StylesBindingsProcessor,
    createElement
} from "@webiny/website-builder-sdk";
import { executeOnChange, applyAncestorUpdates } from "~/editorSdk/utils/executeOnChange.js";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { useBindingsForElement } from "./useBindingsForElement.js";
import { useElementInputsAst } from "~/BaseEditor/hooks/useElementInputsAst.js";
import {
    BreakpointElementMetadata,
    ElementMetadata,
    InputMetadata,
    type IMetadata
} from "~/BaseEditor/metadata/index.js";
import { useElementFactory } from "./useElementFactory.js";
import { PreviewedBindings } from "./PreviewedBindings.js";

export type OnChangeParams = {
    value: InputValueObject;
    metadata: IMetadata;
};

export type InputBindingOnChange = (cb: (params: OnChangeParams) => void) => void;

export class InputValueObject {
    private value: any;

    constructor(value: any) {
        this.value = value;
    }

    set(value: any) {
        this.value = value;
    }

    get() {
        return this.value;
    }

    unset() {
        this.value = undefined;
    }
}

function convertBracketPathToDotPath(path: string): string {
    // Flat binding paths use `/` as the segment separator (e.g. `items/0/label`, `address/city`).
    // lodash `set`/`get` expect `.`-delimited paths, and treat numeric segments as array indexes,
    // so a straight `/` -> `.` conversion handles both nested objects and list items.
    return path.replace(/\//g, ".");
}

/**
 * Reads a value from a deep inputs object using a flat `/`-delimited binding path.
 * Numeric segments are treated as array indexes (e.g. `items/0/label`).
 */
function getDeepValueAtPath(obj: any, path: string): any {
    if (!path) {
        return obj;
    }

    const keys = path.split("/").map(key => (/^\d+$/.test(key) ? Number(key) : key));
    return keys.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/**
 * This makes UI interaction smoother (input blur in particular).
 */
const withTimeout = <T extends (...args: any[]) => unknown>(cb: T): T => {
    return ((...args: Parameters<T>) => {
        setTimeout(() => {
            cb(...args);
        }, 0);
    }) as unknown as T;
};

export const useInputValue = (elementId: string, node: InputAstNode) => {
    const { breakpoint, breakpoints } = useBreakpoint();
    const editor = useDocumentEditor();
    const inputsAst = useElementInputsAst(elementId);
    const elementFactory = useElementFactory();

    const breakpointNames = useMemo(() => breakpoints.map(bp => bp.name), []);

    // These bindings already include per-breakpoint overrides.
    const { rawBindings, resolvedBindings, inheritanceMap } = useBindingsForElement(elementId);

    const inputsProcessor = useMemo(() => {
        return new InputsBindingsProcessor(
            elementId ?? "",
            inputsAst,
            breakpointNames,
            rawBindings,
            elementFactory
        );
    }, [elementId, rawBindings]);

    // This value is the final calculated breakpoint value.
    // Leaf inputs resolve directly from the flat bindings. Container inputs (object / object-list)
    // have no flat entry of their own, so we resolve their deep value (object / array) from the
    // processor - this is what list fields read to render items and to rewrite the whole array.
    const value = useMemo(() => {
        if (node.children.length > 0) {
            const deepInputs = inputsProcessor.toDeepInputs(resolvedBindings.inputs);
            return getDeepValueAtPath(deepInputs, node.path);
        }

        return resolvedBindings.inputs[node.path];
    }, [resolvedBindings, node.path, inputsProcessor]);

    // Metadata is stored under the value's `id`; a value without one gets an id for this render.
    const valueId = useMemo(
        () => value?.id ?? generateAlphaNumericLowerCaseId(),
        [elementId, breakpoint.name, rawBindings]
    );

    const inputMetadata = useMemo((): IMetadata => {
        let elementMetadata: IMetadata = new ElementMetadata(elementId, rawBindings.metadata);

        if (node.input.responsive) {
            elementMetadata = new BreakpointElementMetadata(
                breakpointNames,
                breakpoint.name,
                elementMetadata
            );
        }

        return new InputMetadata(valueId, elementMetadata);
    }, [elementId, breakpoint.name, rawBindings, valueId]);

    const [localState, setLocalValue] = useState<ValueBinding>();

    // See PreviewedBindings: preview patches are diffed against what the preview shows.
    const previewedBindings = useMemo(() => new PreviewedBindings(), [elementId]);

    /**
     * Reads the element's bindings as the document holds them now. A commit runs in a `setTimeout`,
     * and one click can queue several (a text field's blur and the clicked switch's change), all
     * from the same render. Building each from the render's bindings would make the later one write
     * back the earlier one's input with its old value (webiny-js#6189).
     */
    const readCurrentBindings = useCallback(() => {
        const document = editor.getDocumentState().read();
        const currentRaw = toJS(document.bindings[elementId]) ?? {};
        const currentResolved = new BindingsProcessor(breakpointNames).getBindings(
            currentRaw,
            breakpoint.name
        );
        const currentInputsProcessor = new InputsBindingsProcessor(
            elementId ?? "",
            inputsAst,
            breakpointNames,
            currentRaw,
            elementFactory
        );
        const currentStylesProcessor = new StylesBindingsProcessor(
            elementId ?? "",
            breakpointNames,
            currentRaw
        );
        const deepInputs = currentInputsProcessor.toDeepInputs(currentResolved.inputs);
        const currentValue =
            node.children.length > 0
                ? getDeepValueAtPath(deepInputs, node.path)
                : currentResolved.inputs[node.path];

        let elementMetadata: IMetadata = new ElementMetadata(elementId, currentRaw.metadata);
        if (node.input.responsive) {
            elementMetadata = new BreakpointElementMetadata(
                breakpointNames,
                breakpoint.name,
                elementMetadata
            );
        }
        const currentMetadata = new InputMetadata(currentValue?.id ?? valueId, elementMetadata);

        return {
            rawBindings: currentRaw,
            deepInputs,
            value: currentValue,
            metadata: currentMetadata,
            inputsProcessor: currentInputsProcessor,
            stylesProcessor: currentStylesProcessor
        };
    }, [editor, elementId, breakpoint.name, inputsAst, elementFactory, node, valueId]);

    const onChange = useCallback(
        withTimeout((cb: (params: OnChangeParams) => void) => {
            const { rawBindings, deepInputs, value, metadata, inputsProcessor, stylesProcessor } =
                readCurrentBindings();

            const valueObject = new InputValueObject(value);

            const updaterInput = {
                value: valueObject,
                metadata
            };

            // Change the input value (and metadata).
            cb(updaterInput);

            const valuePath = convertBracketPathToDotPath(node.path);
            const devFriendlyInputs = set(
                JSON.parse(JSON.stringify(deepInputs)),
                valuePath,
                valueObject.get()
            );

            const devFriendlyStyles = stylesProcessor.toDeepStyles(rawBindings.styles ?? {});

            // Process input's `onChange`.
            if (node.input.onChange) {
                const callback = functionConverter.deserialize(
                    // TODO: we know it's a string, but on the frontend it's a function. Fix types.
                    node.input.onChange! as any as string
                );

                // Run onChange callback.
                const publicApi = {
                    inputs: devFriendlyInputs,
                    styles: devFriendlyStyles,
                    createElement: (params: CreateElementParams) => {
                        return createElement(params);
                    }
                };

                // Run input's `onChange` callback.
                callback(publicApi, {
                    breakpoint: breakpoint.name
                });
            }

            // Run manifest.onChange + onDescendantChange on ancestors
            const ancestorUpdates = executeOnChange({
                editor,
                elementId,
                deepInputs: devFriendlyInputs,
                action: "update",
                breakpointNames,
                baseBreakpoint: breakpoint.name,
                elementFactory,
                deepStyles: devFriendlyStyles
            });

            editor.updateDocument(document => {
                const inputs = inputsProcessor.createUpdate(devFriendlyInputs, breakpoint.name);
                const styles = stylesProcessor.createUpdate(devFriendlyStyles, breakpoint.name);

                inputs.applyToDocument(document);
                styles.applyToDocument(document);

                metadata.applyToDocument(document);

                applyAncestorUpdates(
                    document,
                    ancestorUpdates,
                    breakpointNames,
                    breakpoint.name,
                    elementFactory
                );
            });

            // Clear local value
            setLocalValue(undefined);
        }),
        [readCurrentBindings]
    );

    /**
     * In preview, we do not update the editor document. Instead, we create a patch and send it to the preview app.
     */
    const onPreviewChange = useCallback(
        (cb: (params: OnChangeParams) => void) => {
            const deepInputs = inputsProcessor.toDeepInputs(resolvedBindings.inputs);

            const valueObject = new InputValueObject(localState ?? value);

            const updaterInput = {
                value: valueObject,
                metadata: inputMetadata
            };

            // Change the input value (and metadata).
            cb(updaterInput);

            const valuePath = convertBracketPathToDotPath(node.path);
            const devFriendlyInputs = set(
                JSON.parse(JSON.stringify(deepInputs)),
                valuePath,
                valueObject.get()
            );

            setLocalValue({ static: valueObject.get() });

            const updatedInputs = inputsProcessor.createUpdate(devFriendlyInputs, breakpoint.name);

            const patch = previewedBindings.createPatch(updatedInputs, rawBindings);

            editor.executeCommand(Commands.PreviewPatchElement, { elementId, patch });
        },
        [elementId, rawBindings, localState, previewedBindings]
    );

    const setBindingType = useCallback(
        (type: "static" | "expression") => {
            editor.updateDocument(state => {
                const bindings = state.bindings[elementId];
                const valueBinding = bindings.inputs![node.path];

                if (type === "static") {
                    // Switching to static bindings means we have to remove the expression binding.
                    delete valueBinding.expression;
                } else {
                    valueBinding.expression = "$noop";
                }

                state.bindings[elementId] = {
                    ...bindings,
                    inputs: {
                        ...bindings.inputs,
                        [node.path]: valueBinding
                    }
                };
            });
        },
        [elementId]
    );

    const onReset = useCallback(() => {
        onChange(({ value, metadata }) => {
            value.unset();
            metadata.unset();
        });
    }, [onChange]);

    return {
        value: localState ?? value,
        metadata: inputMetadata,
        inheritanceMap: inheritanceMap.inputs[node.path],
        onReset,
        onChange,
        onPreviewChange,
        setBindingType
    };
};
