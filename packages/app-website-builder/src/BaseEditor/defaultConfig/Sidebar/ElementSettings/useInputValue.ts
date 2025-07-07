import { useCallback, useMemo, useState } from "react";
import set from "lodash/set";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils/generateId";
import { useDocumentEditor } from "~/DocumentEditor";
import type { ValueBinding } from "~/sdk/types";
import { Commands } from "~/BaseEditor";
import { InputAstNode } from "~/sdk/ComponentManifestToAstConverter";
import { functionConverter } from "~/sdk";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint";
import { useBindingsForElement } from "./useBindingsForElement";
import { useElementInputsAst } from "~/BaseEditor/hooks/useElementInputsAst";
import { InputsBindingsProcessor } from "~/sdk/InputBindingsProcessor";
import { StylesBindingsProcessor } from "~/sdk/StylesBindingsProcessor";
import { createElement, CreateElementParams } from "~/sdk/createElement";
import {
    BreakpointElementMetadata,
    ElementMetadata,
    InputMetadata,
    type IMetadata
} from "~/BaseEditor/metadata";
import { useElementFactory } from "./useElementFactory";

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
    return path.replace(/\/(\d+)\//g, ".$1");
}

export const useInputValue = (elementId: string, node: InputAstNode) => {
    const { breakpoint, breakpoints } = useBreakpoint();
    const editor = useDocumentEditor();
    const inputsAst = useElementInputsAst(elementId);
    const elementFactory = useElementFactory();

    const breakpointNames = useMemo(() => breakpoints.map(bp => bp.name), []);

    // These bindings already include per-breakpoint overrides.
    const { rawBindings, resolvedBindings, inheritanceMap } = useBindingsForElement(elementId);

    const stylesProcessor = useMemo(() => {
        return new StylesBindingsProcessor(elementId ?? "", breakpointNames, rawBindings);
    }, [elementId, rawBindings]);

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
    const value = resolvedBindings.inputs[node.path];

    const inputMetadata = useMemo((): IMetadata => {
        let elementMetadata: IMetadata = new ElementMetadata(elementId, rawBindings.metadata);

        if (node.input.responsive) {
            elementMetadata = new BreakpointElementMetadata(
                breakpointNames,
                breakpoint.name,
                elementMetadata
            );
        }

        const valueId = value?.id ?? generateAlphaNumericLowerCaseId();

        return new InputMetadata(valueId, elementMetadata);
    }, [elementId, breakpoint.name, rawBindings]);

    const [localState, setLocalValue] = useState<ValueBinding>();

    const onChange = useCallback(
        (cb: (params: OnChangeParams) => void) => {
            const deepInputs = inputsProcessor.toDeepInputs(resolvedBindings.inputs);

            const valueObject = new InputValueObject(value);

            const updaterInput = {
                value: valueObject,
                metadata: inputMetadata
            };

            // Change the input value (and metadata).
            cb(updaterInput);

            const valuePath = convertBracketPathToDotPath(node.path);
            const devFriendlyInputs = set(
                structuredClone(deepInputs),
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

            editor.updateDocument(document => {
                const inputs = inputsProcessor.createUpdate(devFriendlyInputs, breakpoint.name);
                const styles = stylesProcessor.createUpdate(devFriendlyStyles, breakpoint.name);

                inputs.applyToDocument(document);
                styles.applyToDocument(document);

                inputMetadata.applyToDocument(document);
            });

            // Clear local value
            setLocalValue(undefined);
        },
        [elementId, resolvedBindings, breakpoint]
    );

    /**
     * In preview, we do not update the editor document. Instead, we create a patch and send it to the preview app.
     */
    const onPreviewChange = useCallback(
        (cb: (params: OnChangeParams) => void) => {
            const deepInputs = inputsProcessor.toDeepInputs(resolvedBindings.inputs);

            const valueObject = new InputValueObject(value);

            const updaterInput = {
                value: valueObject,
                metadata: inputMetadata
            };

            // Change the input value (and metadata).
            cb(updaterInput);

            const valuePath = convertBracketPathToDotPath(node.path);
            const devFriendlyInputs = set(
                structuredClone(deepInputs),
                valuePath,
                valueObject.get()
            );

            setLocalValue({ static: valueObject.get() });

            const updatedInputs = inputsProcessor.createUpdate(devFriendlyInputs, breakpoint.name);

            editor.executeCommand(Commands.PreviewPatchElement, {
                elementId: elementId,
                patch: updatedInputs.createJsonPatch(rawBindings)
            });
        },
        [elementId, rawBindings]
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
