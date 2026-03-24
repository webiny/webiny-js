import { toJS } from "mobx";
import type { Editor } from "../Editor.js";
import type {
    OnChangeAction,
    ComponentManifest,
    Document,
    OnChangeElementContext,
    Stop,
    Continue
} from "@webiny/website-builder-sdk";
import {
    buildAncestors,
    ComponentManifestToAstConverter,
    createElement,
    ElementFactory,
    InputsBindingsProcessor
} from "@webiny/website-builder-sdk";

const STOP_SYMBOL: Stop = Symbol.for("wb.handler.stop") as unknown as Stop;
const CONTINUE_SYMBOL: Continue = Symbol.for("wb.handler.continue") as unknown as Continue;
const stop = (): Stop => STOP_SYMBOL;
const cont = (): Continue => CONTINUE_SYMBOL;

function runHandlers<TCtx>(
    handlers: ((ctx: TCtx) => any) | ((ctx: TCtx) => any)[],
    ctx: TCtx
): void {
    if (Array.isArray(handlers)) {
        for (const handler of handlers) {
            if (handler(ctx) === STOP_SYMBOL) {
                return;
            }
        }
    } else {
        handlers(ctx);
    }
}

export interface AncestorUpdate {
    elementId: string;
    manifest: ComponentManifest;
    inputs: Record<string, any>;
}

interface ExecuteOnChangeParams {
    editor: Editor;
    elementId: string;
    /** When provided, used as-is. When omitted, resolved from the document. */
    deepInputs?: Record<string, any>;
    action: OnChangeAction;
    breakpointNames: string[];
    baseBreakpoint: string;
    elementFactory: ElementFactory;
    /** Optional deep styles — only available from the sidebar UI path. */
    deepStyles?: Record<string, any>;
}

/**
 * Runs manifest.onChange on the element, then walks up the ancestor chain
 * firing onDescendantChange on each ancestor that defines it.
 *
 * Returns an array of ancestor updates that must be flushed inside
 * editor.updateDocument().
 */
export function executeOnChange(params: ExecuteOnChangeParams): AncestorUpdate[] {
    const {
        editor,
        elementId,
        action,
        breakpointNames,
        baseBreakpoint,
        elementFactory,
        deepStyles
    } = params;

    const ancestorUpdates: AncestorUpdate[] = [];

    const document = editor.getDocumentState().read();
    const components = editor.getEditorState().read().components;
    const element = document.elements[elementId];
    if (!element) {
        return ancestorUpdates;
    }

    const manifest = components[element.component.name];

    // Resolve deep inputs from the document when not explicitly provided.
    const deepInputs =
        params.deepInputs ??
        (manifest
            ? getDeepInputsForElement(
                  elementId,
                  manifest,
                  document,
                  breakpointNames,
                  elementFactory
              )
            : {});

    // --- manifest.onChange on the element itself ---
    if (manifest?.onChange) {
        const ancestors = buildAncestors(element, components, document);
        const getElement = createGetElement(document, components, breakpointNames, elementFactory);
        runHandlers(manifest.onChange, {
            action,
            id: elementId,
            component: manifest,
            inputs: deepInputs,
            styles: deepStyles ?? {},
            getAncestor: componentName => {
                const found = ancestors.find(a => a.manifest.name === componentName);
                if (!found) {
                    return undefined;
                }
                return buildAncestorContext(
                    found.element.id,
                    found.manifest,
                    document,
                    breakpointNames,
                    elementFactory,
                    ancestorUpdates,
                    getElement
                );
            },
            getElement,
            createElement: p => createElement(p),
            executeCommand: <T = unknown>(command: string, payload?: T) => {
                editor.executeCommand({ type: command }, payload);
            },
            breakpoint: baseBreakpoint,
            log: (...args: any[]) => console.log(...args),
            stop,
            continue: cont
        });
    }

    // --- onDescendantChange on each ancestor ---
    fireDescendantChange({
        editor,
        element,
        elementId,
        deepInputs,
        action,
        document,
        components,
        breakpointNames,
        baseBreakpoint,
        elementFactory,
        ancestorUpdates
    });

    return ancestorUpdates;
}

function fireDescendantChange(params: {
    editor: Editor;
    element: { parent?: { id: string; slot: string }; component: { name: string } };
    elementId: string;
    deepInputs: Record<string, any>;
    action: OnChangeAction;
    document: Document;
    components: Record<string, ComponentManifest>;
    breakpointNames: string[];
    baseBreakpoint: string;
    elementFactory: ElementFactory;
    ancestorUpdates: AncestorUpdate[];
}) {
    const {
        editor,
        element,
        elementId,
        deepInputs,
        action,
        document,
        components,
        breakpointNames,
        baseBreakpoint,
        elementFactory,
        ancestorUpdates
    } = params;

    let currentParentId = element.parent?.id;

    while (currentParentId) {
        const parentEl = document.elements[currentParentId];
        if (!parentEl) {
            break;
        }

        const parentManifest = components[parentEl.component.name];
        if (parentManifest?.onDescendantChange) {
            const parentDeep = getDeepInputsForElement(
                parentEl.id,
                parentManifest,
                document,
                breakpointNames,
                elementFactory
            );

            const getElement = createGetElement(
                document,
                components,
                breakpointNames,
                elementFactory
            );
            runHandlers(parentManifest.onDescendantChange, {
                action,
                descendant: {
                    component: components[element.component.name],
                    id: elementId,
                    inputs: structuredClone(deepInputs)
                },
                inputs: parentDeep,
                updateInputs: (cb: (inputs: Record<string, any>) => void) => {
                    cb(parentDeep);
                    ancestorUpdates.push({
                        elementId: parentEl.id,
                        manifest: parentManifest,
                        inputs: parentDeep
                    });
                },
                getElement,
                executeCommand: <T = unknown>(command: string, payload?: T) =>
                    editor.executeCommand({ type: command }, payload as Record<string, any>),
                breakpoint: baseBreakpoint,
                log: (...args: any[]) => console.log(...args),
                stop,
                continue: cont
            });
        }

        currentParentId = parentEl.parent?.id;
    }
}

function buildAncestorContext(
    ancestorElementId: string,
    ancestorManifest: ComponentManifest,
    document: Document,
    breakpointNames: string[],
    elementFactory: ElementFactory,
    ancestorUpdates: AncestorUpdate[],
    getElement: (id: string) => OnChangeElementContext | undefined
) {
    const deepInputs = getDeepInputsForElement(
        ancestorElementId,
        ancestorManifest,
        document,
        breakpointNames,
        elementFactory
    );

    return {
        id: ancestorElementId,
        component: ancestorManifest,
        inputs: deepInputs,
        updateInputs: (cb: (inputs: Record<string, any>) => void) => {
            cb(deepInputs);
            ancestorUpdates.push({
                elementId: ancestorElementId,
                manifest: ancestorManifest,
                inputs: deepInputs
            });
        },
        getElement
    };
}

function createGetElement(
    document: Document,
    components: Record<string, ComponentManifest>,
    breakpointNames: string[],
    elementFactory: ElementFactory
): (id: string) => OnChangeElementContext | undefined {
    return (id: string) => {
        const el = document.elements[id];
        if (!el) {
            return undefined;
        }
        const manifest = components[el.component.name];
        if (!manifest) {
            return undefined;
        }
        const inputs = getDeepInputsForElement(
            id,
            manifest,
            document,
            breakpointNames,
            elementFactory
        );
        return { id, component: manifest, inputs };
    };
}

function getDeepInputsForElement(
    elId: string,
    manifest: ComponentManifest,
    document: Document,
    breakpointNames: string[],
    elementFactory: ElementFactory
): Record<string, any> {
    const rawBindings = toJS(document.bindings[elId]) ?? {};
    const ast = ComponentManifestToAstConverter.convert(manifest.inputs);
    const processor = new InputsBindingsProcessor(
        elId,
        ast,
        breakpointNames,
        rawBindings,
        elementFactory
    );
    return structuredClone(processor.toDeepInputs(rawBindings.inputs ?? {}));
}

/**
 * Apply collected ancestor updates inside editor.updateDocument().
 */
export function applyAncestorUpdates(
    doc: Document,
    updates: AncestorUpdate[],
    breakpointNames: string[],
    baseBreakpoint: string,
    elementFactory: ElementFactory
): void {
    for (const update of updates) {
        const rawBindings = doc.bindings[update.elementId] ?? { inputs: {} };
        const ast = ComponentManifestToAstConverter.convert(update.manifest.inputs);

        // Refresh slot values from the current document state so that
        // ancestor updates don't overwrite slot changes made by the
        // caller (e.g. element deletion removing an ID from a slot).
        refreshSlotValues(ast, rawBindings.inputs ?? {}, update.inputs);

        const processor = new InputsBindingsProcessor(
            update.elementId,
            ast,
            breakpointNames,
            rawBindings,
            elementFactory
        );
        const inputsUpdate = processor.createUpdate(update.inputs, baseBreakpoint);
        inputsUpdate.applyToDocument(doc);
    }
}

/**
 * Walk the AST and overwrite slot values in `deepInputs` with the
 * current flat binding values from `currentFlat`. This prevents stale
 * slot snapshots (captured before element removal) from restoring
 * deleted element references.
 */
function refreshSlotValues(
    ast: ReturnType<typeof ComponentManifestToAstConverter.convert>,
    currentFlat: Record<string, any>,
    deepInputs: Record<string, any>
) {
    const walk = (nodes: typeof ast, target: Record<string, any>, prefix: string[]) => {
        for (const node of nodes) {
            const pathParts = [...prefix, node.name];
            const flatKey = pathParts.join("/");

            if (node.children.length > 0) {
                // Recurse into object children (skip list objects — their
                // slots are nested under indexed paths we can't enumerate here).
                if (!node.list && target[node.name] && typeof target[node.name] === "object") {
                    walk(node.children, target[node.name], pathParts);
                }
            } else if (node.type === "slot") {
                // Overwrite with current document value
                const current = currentFlat[flatKey];
                if (current) {
                    target[node.name] = current.static;
                }
            }
        }
    };

    walk(ast, deepInputs, []);
}
