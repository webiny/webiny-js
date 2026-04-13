import deepEqual from "deep-equal";
import { mutableSet } from "@webiny/utils/dotProp/index.js";
import type { DocumentElementBindings, DocumentElementInputBindings } from "~/types.js";
import { InheritedValueResolver } from "~/InheritedValueResolver.js";
import type { InputAstNode } from "~/ComponentManifestToAstConverter.js";
import { DocumentOperations, type IDocumentOperation } from "~/documentOperations/index.js";
import type { ElementFactory } from "~/ElementFactory.js";
import { InputsUpdater } from "~/InputsUpdater.js";
import { generateElementId } from "./generateElementId.js";
type DeepBindings = Record<string, any>;

export type ElementInputsBindings = {
    inputs: DocumentElementInputBindings;
    overrides: {
        [breakpoint: string]: {
            inputs: DocumentElementInputBindings;
        };
    };
};

/**
 * Handles deep-to-flat and flat-to-deep conversion of input bindings,
 * with breakpoint inheritance awareness.
 */
export class InputsBindingsProcessor {
    private breakpoints: string[];
    private rawBindings: DocumentElementBindings;
    private elementFactory: ElementFactory;
    private elementId: string;
    private inputsAst: InputAstNode[];
    private elementReferences: Set<string>;

    constructor(
        elementId: string,
        inputsAst: InputAstNode[],
        breakpoints: string[],
        rawBindings: DocumentElementBindings,
        elementFactory: ElementFactory
    ) {
        this.elementId = elementId;
        this.inputsAst = inputsAst;
        this.breakpoints = breakpoints;
        this.rawBindings = rawBindings;
        this.elementFactory = elementFactory;
        this.elementReferences = this.getElementReferences(rawBindings.inputs);
    }

    /**
     * Converts flat input bindings into deep inputs object (removes `.static` wrappers).
     */
    public toDeepInputs(flat: NonNullable<DocumentElementBindings["inputs"]>): DeepBindings {
        const result: DeepBindings = {};

        // Assigns a value to a nested path within the result object, creating arrays/objects as needed.
        const assignValue = (path: (string | number)[], value: any) => {
            let current = result;
            for (let i = 0; i < path.length - 1; i++) {
                const key = path[i];
                const nextKey = path[i + 1];
                const isNextIndex = typeof nextKey === "number";

                if (typeof key === "number") {
                    if (!Array.isArray(current)) {
                        throw new Error("Expected array in path assignment.");
                    }
                    while (current.length <= key) {
                        current.push(isNextIndex ? [] : {});
                    }
                    if (typeof current[key] !== "object") {
                        current[key] = isNextIndex ? [] : {};
                    }
                    current = current[key];
                } else {
                    if (!(key in current) || typeof current[key] !== "object") {
                        current[key] = isNextIndex ? [] : {};
                    }
                    current = current[key];
                }
            }
            current[path[path.length - 1]] = value;
        };

        // Recursively walks the AST and assigns values from flat bindings to the nested result.
        const walk = (nodes: InputAstNode[], prefix: string[]) => {
            for (const node of nodes) {
                const pathParts = [...prefix, node.name];
                const flatKey = pathParts.join("/");
                const entry = flat[flatKey];
                const staticValue = entry?.static;

                if (node.children.length > 0) {
                    if (node.list) {
                        const pattern = new RegExp(`^${flatKey}\\/(\\d+)\\/`);
                        const indexes = Object.keys(flat).reduce((acc: number[], key) => {
                            const match = key.match(pattern);
                            if (match) {
                                acc.push(parseInt(match[1], 10));
                            }
                            return acc;
                        }, []);

                        const uniqueIndexes = Array.from(new Set(indexes)).sort((a, b) => a - b);

                        for (const i of uniqueIndexes) {
                            walk(node.children, [...prefix, `${node.name}/${i}`]);
                        }
                    } else {
                        walk(node.children, pathParts);
                    }
                } else if (staticValue !== undefined) {
                    const path = pathParts.reduce<(string | number)[]>((acc, part) => {
                        const match = part.match(/(.*?)\/(\d+)/);
                        if (match) {
                            acc.push(match[1], Number(match[2]));
                        } else {
                            acc.push(part);
                        }
                        return acc;
                    }, []);
                    assignValue(path, staticValue);
                }
            }
        };

        walk(this.inputsAst, []);
        return result;
    }

    /**
     * Flattens deep inputs object into flat bindings with `.static` wrappers,
     * skipping overrides that match inherited parent breakpoint values.
     */
    public createUpdate(inputs: DeepBindings, breakpoint: string) {
        const operations: IDocumentOperation[] = [];
        const originalInputs = this.rawBindings.inputs ?? {};

        const rebuilt: ElementInputsBindings = { inputs: {}, overrides: {} };

        // Clone existing overrides if present, to avoid losing breakpoint overrides
        if (this.rawBindings.overrides) {
            for (const [bp, overrides] of Object.entries(this.rawBindings.overrides)) {
                if (overrides.inputs) {
                    mutableSet(
                        rebuilt,
                        `overrides.${bp}.inputs`,
                        structuredClone(this.rawBindings.overrides[bp].inputs)
                    );
                }
            }
        }

        // Set to track which flat binding paths we've processed during traversal
        const seenPaths = new Set<string>();
        const valueResolver = new InheritedValueResolver(this.breakpoints, bp => {
            if (this.isBaseBreakpoint(bp)) {
                return this.rawBindings.inputs;
            }
            return this.rawBindings.overrides?.[bp]?.inputs;
        });

        // Extracts a nested value from an object based on a flat string path.
        // Supports array indexes like 'rows/0/columns/1/children'.
        const getValue = (obj: any, path: string): any => {
            const segments = path.split("/");
            const keys = segments.flatMap(segment => {
                return segment.split(".").map(part => {
                    return /^\d+$/.test(part) ? parseInt(part, 10) : part;
                });
            });
            return keys.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
        };

        // Recursively traverses the AST nodes, comparing new input values with original bindings.
        // Collects changed values into 'rebuilt' and generates operations for new elements.
        const compareAndCollect = (nodes: InputAstNode[], prefix: string[]) => {
            for (const node of nodes) {
                const pathParts = [...prefix, node.name];
                const flatKey = pathParts.join("/");

                // Mark this path as seen
                seenPaths.add(flatKey);

                if (node.children.length) {
                    if (node.list) {
                        // For list nodes, process each indexed item separately
                        const list = getValue(inputs, flatKey);
                        if (Array.isArray(list)) {
                            for (let i = 0; i < list.length; i++) {
                                // Recurse with indexed path like 'rows[0]', 'rows[1]'
                                compareAndCollect(node.children, [
                                    ...pathParts.slice(0, -1),
                                    `${node.name}/${i}`
                                ]);
                            }
                        }
                    } else {
                        // For single object nodes, recurse normally
                        compareAndCollect(node.children, pathParts);
                    }
                } else {
                    // Leaf node (primitive or slot) processing

                    // Get current new value from deep inputs
                    let newValue = getValue(inputs, flatKey);

                    // Get original binding entry for this path
                    const originalEntry = originalInputs[flatKey];

                    // Skip if newValue is undefined and no original entry
                    if (newValue === undefined && !originalEntry) {
                        continue;
                    }

                    // For list slots, process CreateElement items within the array.
                    if (node.list && Array.isArray(newValue)) {
                        newValue = newValue.map(item => {
                            if (
                                typeof item === "object" &&
                                item !== null &&
                                item.action === "CreateElement"
                            ) {
                                const newElement = this.elementFactory.createElementFromComponent({
                                    componentName: item.params.component,
                                    parentId: this.elementId,
                                    slot: flatKey,
                                    bindings: item.params
                                });
                                // Skip AddToParent — this processor manages the binding array.
                                operations.push(
                                    ...newElement.operations.filter(
                                        op => !(op instanceof DocumentOperations.AddToParent)
                                    )
                                );
                                return newElement.element.id;
                            }
                            return item;
                        });
                    }

                    if (
                        !Array.isArray(newValue) &&
                        typeof newValue === "object" &&
                        newValue?.action === "CreateElement"
                    ) {
                        // Handle single (non-list) CreateElement action
                        const newElement = this.elementFactory.createElementFromComponent({
                            componentName: newValue.params.component,
                            parentId: this.elementId,
                            slot: flatKey,
                            index: -1,
                            bindings: newValue.params
                        });

                        const createdId = newElement.element.id;

                        // Assign or generate a stable unique id for the binding
                        const existingId = originalEntry?.id;
                        const idToUse = existingId ?? generateElementId();

                        // Build binding for the new element id(s)
                        const binding = {
                            static: createdId,
                            type: node.type,
                            list: node.list,
                            id: idToUse
                        };

                        if (node.input?.responsive && !this.isBaseBreakpoint(breakpoint)) {
                            const inheritedValue = valueResolver.getInheritedValue(
                                flatKey,
                                breakpoint
                            );

                            if (binding.static === undefined) {
                                // Unset override
                                if (rebuilt.overrides[breakpoint]?.inputs?.[flatKey]) {
                                    delete rebuilt.overrides[breakpoint].inputs[flatKey];
                                }
                            } else if (
                                inheritedValue === undefined ||
                                !deepEqual(inheritedValue, binding.static)
                            ) {
                                if (!rebuilt.overrides[breakpoint]) {
                                    rebuilt.overrides[breakpoint] = { inputs: {} };
                                }
                                rebuilt.overrides[breakpoint].inputs[flatKey] = binding;
                            } else {
                                if (rebuilt.overrides[breakpoint]?.inputs?.[flatKey]) {
                                    delete rebuilt.overrides[breakpoint].inputs[flatKey];
                                }
                            }

                            if (originalEntry) {
                                rebuilt.inputs[flatKey] = originalEntry;
                            }
                        } else {
                            // Normal case: update base inputs
                            rebuilt.inputs[flatKey] = binding;
                        }

                        // Skip AddToParent — this processor manages the binding directly.
                        operations.push(
                            ...newElement.operations.filter(
                                op => !(op instanceof DocumentOperations.AddToParent)
                            )
                        );
                    } else {
                        // Normal value update
                        const isResponsive =
                            node.input?.responsive && !this.isBaseBreakpoint(breakpoint);

                        // Assign or generate a stable unique id for the binding
                        const existingId = originalEntry?.id;
                        const idToUse = existingId ?? generateElementId();

                        // Merge existing original entry data with updated static value
                        const binding = {
                            ...(originalEntry ?? {}),
                            static: newValue,
                            type: node.type,
                            list: node.list,
                            id: idToUse
                        };

                        if (isResponsive) {
                            const inheritedValue = valueResolver.getInheritedValue(
                                flatKey,
                                breakpoint
                            );

                            if (binding.static === undefined) {
                                // Unset override
                                if (rebuilt.overrides[breakpoint]?.inputs?.[flatKey]) {
                                    delete rebuilt.overrides[breakpoint].inputs[flatKey];
                                }
                            } else if (
                                inheritedValue === undefined ||
                                !deepEqual(inheritedValue, binding.static)
                            ) {
                                if (!rebuilt.overrides[breakpoint]) {
                                    rebuilt.overrides[breakpoint] = { inputs: {} };
                                }
                                rebuilt.overrides[breakpoint].inputs[flatKey] = binding;
                            } else {
                                if (rebuilt.overrides[breakpoint]?.inputs?.[flatKey]) {
                                    delete rebuilt.overrides[breakpoint].inputs[flatKey];
                                }
                            }

                            if (originalEntry) {
                                rebuilt.inputs[flatKey] = originalEntry;
                            }
                        } else {
                            // Base binding update
                            rebuilt.inputs[flatKey] = binding;
                        }
                    }
                }
            }
        };

        // Start the AST traversal and collection.
        compareAndCollect(this.inputsAst, []);

        // Identify elements referenced in slots that were removed since last state,
        // and queue their removal.
        const usedSlotIds = this.getElementReferences(rebuilt.inputs);
        for (const id of this.elementReferences) {
            if (!usedSlotIds.has(id)) {
                operations.push(new DocumentOperations.RemoveElement(id));
            }
        }

        return new InputsUpdater(this.elementId, rebuilt, operations);
    }

    // Returns a set of element IDs referenced in slot bindings within the provided inputs.
    private getElementReferences(inputs: DocumentElementBindings["inputs"] = {}) {
        const references = new Set<string>();

        for (const [, binding] of Object.entries(inputs)) {
            if (binding.type === "slot") {
                if (Array.isArray(binding.static)) {
                    ((binding.static ?? []) as string[]).forEach(id => references.add(id));
                } else if (typeof binding.static === "string") {
                    references.add(binding.static);
                }
            }
        }

        return references;
    }

    private isBaseBreakpoint(name: string): boolean {
        return this.breakpoints.indexOf(name) === 0;
    }
}
