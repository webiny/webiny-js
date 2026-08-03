import { useCallback, useMemo, useState } from "react";
import set from "lodash/set.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils/generateId.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type {
    ValueBinding,
    CreateElementParams,
    TokenReference
} from "@webiny/website-builder-sdk";
import { isTokenBinding } from "@webiny/website-builder-sdk";
import { Commands } from "~/BaseEditor/index.js";
import type { InputAstNode } from "@webiny/website-builder-sdk";
import {
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

export type OnChangeParams = {
    value: InputValueObject;
    metadata: IMetadata;
};

export type InputBindingOnChange = (cb: (params: OnChangeParams) => void) => void;

export class InputValueObject {
    private value: any;
    private token: TokenReference | undefined;

    constructor(value: any, token?: TokenReference) {
        this.value = value;
        this.token = token;
    }

    /**
     * Sets a literal value, clearing any token reference.
     *
     * Clearing is the point: a binding holds either a reference or a literal, so picking a free value is
     * how a user detaches an input from the theme. A renderer that offers both does not need to think
     * about it — `set` and `setToken` are mutually exclusive by construction.
     */
    set(value: any) {
        this.value = value;
        this.token = undefined;
    }

    /**
     * Binds this input to a design token.
     *
     * `value` is still set, to the token's resolved colour: it becomes the reference's `fallback`, so
     * content keeps rendering the value it had if the theme is later deactivated.
     */
    setToken(token: TokenReference, resolvedValue?: any) {
        this.token = token;
        if (resolvedValue !== undefined) {
            this.value = resolvedValue;
        }
    }

    getToken() {
        return this.token;
    }

    get() {
        return this.value;
    }

    unset() {
        this.value = undefined;
        this.token = undefined;
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
        withTimeout((cb: (params: OnChangeParams) => void) => {
            const deepInputs = inputsProcessor.toDeepInputs(resolvedBindings.inputs);

            const valueObject = new InputValueObject(
                value,
                isTokenBinding(value) ? value.token : undefined
            );

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

            // Seeded from every token already on this element, then adjusted for the one input that
            // changed. Passing only the changed path would rewrite every other token binding on the
            // element as a frozen literal, because an absent path is how `createUpdate` is told to clear
            // a reference.
            const tokens = inputsProcessor.toTokenMap(resolvedBindings.inputs);
            const changedToken = valueObject.getToken();
            if (changedToken) {
                tokens[node.path] = changedToken;
            } else {
                delete tokens[node.path];
            }

            editor.updateDocument(document => {
                const inputs = inputsProcessor.createUpdate(
                    devFriendlyInputs,
                    breakpoint.name,
                    tokens
                );
                const styles = stylesProcessor.createUpdate(devFriendlyStyles, breakpoint.name);

                inputs.applyToDocument(document);
                styles.applyToDocument(document);

                inputMetadata.applyToDocument(document);

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
        [elementId, resolvedBindings, breakpoint]
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
                structuredClone(deepInputs),
                valuePath,
                valueObject.get()
            );

            const previewToken = valueObject.getToken();

            // Mirrors the binding shape, so a token picked in preview looks the same to the renderer as
            // one that has been committed.
            setLocalValue(previewToken ? { token: previewToken } : { static: valueObject.get() });

            const previewTokens = inputsProcessor.toTokenMap(resolvedBindings.inputs);
            if (previewToken) {
                previewTokens[node.path] = previewToken;
            } else {
                delete previewTokens[node.path];
            }

            const updatedInputs = inputsProcessor.createUpdate(
                devFriendlyInputs,
                breakpoint.name,
                previewTokens
            );
            const patch = updatedInputs.createJsonPatch(rawBindings);

            editor.executeCommand(Commands.PreviewPatchElement, { elementId, patch });
        },
        [elementId, rawBindings, localState]
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
