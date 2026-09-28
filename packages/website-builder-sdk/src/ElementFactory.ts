import { generateElementId } from "./generateElementId.js";
import type {
    DocumentElement,
    ComponentManifest,
    InputValueBinding,
    StyleValueBinding,
    CssProperties
} from "~/types.js";
import { type IDocumentOperation, DocumentOperations } from "./documentOperations/index.js";
import {
    ComponentManifestToAstConverter,
    type InputAstNode
} from "./ComponentManifestToAstConverter.js";
import { ComponentInputTraverser } from "./ComponentInputTraverser.js";
import { assertBindingShapes } from "./assertBindingShapes.js";
import { logger } from "./Logger.js";

const defaultStyles = {
    display: "flex",
    flexDirection: "column"
};

const withDefaultStyles = (styles: CssProperties) => {
    return { ...defaultStyles, ...styles };
};

export interface ElementFactoryCreateElementParams {
    componentName: string;
    parentId: string;
    slot: string;
    index?: number;
    bindings?: {
        inputs?: Record<string, any>;
        styles?: Record<string, any>;
        overrides?: {
            [breakpoint: string]: {
                inputs?: Record<string, any>;
                styles?: Record<string, any>;
            };
        };
    };
}

interface GenerateOperationsParams {
    element: DocumentElement;
    inputsAst: InputAstNode[];
    operations: ElementFactoryOperations;
    bindings: {
        inputs: Record<string, any>;
        styles: Record<string, any>;
        overrides: {
            [breakpoint: string]: {
                inputs?: Record<string, any>;
                styles?: Record<string, any>;
            };
        };
    };
}

interface GenerateOperationsFromBindingsParams {
    elementId: string;
    inputsAst: InputAstNode[];
    bindings: {
        inputs: Record<string, any>;
        styles: Record<string, any>;
    };
    operations: ElementFactoryOperations;
    ignoreDefaultValues: boolean;
}

type ElementFactoryOperations = {
    addElement: (element: DocumentElement) => IDocumentOperation;
    addToParent: (element: DocumentElement, index?: number) => IDocumentOperation;
    setInputBinding: (
        elementId: string,
        bindingPath: string,
        binding: InputValueBinding
    ) => IDocumentOperation;
    setStyleBinding: (
        elementId: string,
        bindingPath: string,
        binding: StyleValueBinding
    ) => IDocumentOperation;
};

const defaultOperations: ElementFactoryOperations = {
    addElement: (element: DocumentElement) => {
        return new DocumentOperations.AddElement(element);
    },
    addToParent: (element: DocumentElement, index?: number) => {
        return new DocumentOperations.AddToParent(element, index);
    },
    setInputBinding: (elementId, bindingPath, binding) => {
        return new DocumentOperations.SetGlobalInputBinding(elementId, bindingPath, binding);
    },
    setStyleBinding: (elementId, bindingPath, binding) => {
        return new DocumentOperations.SetGlobalStyleBinding(elementId, bindingPath, binding);
    }
};

export class ElementFactory {
    constructor(private components: Record<string, ComponentManifest>) {}

    public createElementFromComponent({
        componentName,
        parentId,
        slot,
        index,
        bindings
    }: ElementFactoryCreateElementParams) {
        const { element, componentManifest, inputsAst } = this.createElement(
            componentName,
            parentId,
            slot
        );

        const documentOps: IDocumentOperation[] = [
            defaultOperations.addElement(element),
            defaultOperations.addToParent(element, index)
        ];

        const baseStyles = bindings?.styles ?? componentManifest.defaults?.styles ?? {};
        const resolvedStyles =
            componentManifest.applyDefaultStyles === false
                ? baseStyles
                : withDefaultStyles(baseStyles);

        documentOps.push(
            ...this.generateOperations({
                element,
                inputsAst,
                bindings: {
                    inputs: bindings?.inputs ?? componentManifest.defaults?.inputs ?? {},
                    styles: resolvedStyles,
                    overrides: bindings?.overrides ?? {}
                },
                operations: defaultOperations
            })
        );

        return { element, operations: documentOps };
    }

    public generateOperations({
        element,
        inputsAst,
        bindings,
        operations
    }: GenerateOperationsParams): IDocumentOperation[] {
        const ops = this.generateOperationsFromBindings({
            elementId: element.id,
            inputsAst,
            bindings,
            operations,
            ignoreDefaultValues: false
        });

        if (bindings.overrides) {
            for (const [breakpoint, overrides] of Object.entries(bindings.overrides)) {
                ops.push(
                    ...this.generateOperationsFromBindings({
                        elementId: element.id,
                        inputsAst,
                        bindings: {
                            inputs: overrides.inputs ?? {},
                            styles: overrides.styles ?? {}
                        },
                        operations: {
                            ...operations,
                            setInputBinding: (elementId, bindingPath, binding) => {
                                return new DocumentOperations.SetInputBindingOverride(
                                    elementId,
                                    bindingPath,
                                    binding,
                                    breakpoint
                                );
                            },
                            setStyleBinding: (elementId, bindingPath, binding) => {
                                return new DocumentOperations.SetStyleBindingOverride(
                                    elementId,
                                    bindingPath,
                                    binding,
                                    breakpoint
                                );
                            }
                        },
                        ignoreDefaultValues: true
                    })
                );
            }
        }

        return ops;
    }

    private generateOperationsFromBindings({
        elementId,
        inputsAst,
        bindings,
        operations,
        ignoreDefaultValues
    }: GenerateOperationsFromBindingsParams): IDocumentOperation[] {
        const inputData = bindings.inputs;
        const traverser = new ComponentInputTraverser(inputsAst);

        const ops: IDocumentOperation[] = [];

        traverser.traverse(inputData, (node, path, value) => {
            const isCreateElement = value?.action === "CreateElement";
            const isList = node.list;
            const isObject = node.type === "object";

            if (isCreateElement) {
                const factory = new ElementFactory(this.components);
                const newElement = factory.createElementFromComponent({
                    componentName: value.params.component,
                    // undefined index = append to end of the slot array
                    index: isList ? undefined : 0,
                    slot: path,
                    parentId: elementId,
                    bindings: value.params
                });

                const newElementId = newElement.element.id;

                ops.push(...newElement.operations);

                if (isList) {
                    // For list slots, AddToParent already manages the static array.
                    // We only set metadata here.
                    ops.push(
                        operations.setInputBinding(elementId, path, {
                            id: generateElementId(),
                            type: node.type,
                            translatable: node.input.translatable,
                            list: node.list
                        })
                    );
                } else {
                    ops.push(
                        operations.setInputBinding(elementId, path, {
                            id: generateElementId(),
                            static: newElementId,
                            type: node.type,
                            translatable: node.input.translatable,
                            list: node.list
                        })
                    );
                }
            } else if (isObject && isList) {
                return;
            } else {
                ops.push(
                    operations.setInputBinding(elementId, path, {
                        id: generateElementId(),
                        static: ignoreDefaultValues
                            ? undefined
                            : (value ?? node.input.defaultValue),
                        type: node.type,
                        list: node.list,
                        translatable: node.input.translatable
                    })
                );
            }
        });

        /*
         * The bindings just written, checked against the shapes the inputs declare.
         *
         * Here rather than on `bindings.inputs`, because the defect this catches lived between the
         * two: a correct array arrived and the traverser collapsed it while writing. A check on the
         * inputs passed while every page built from them failed to render.
         *
         * Warns rather than throws: a page that renders most of itself beats a page that refuses to
         * build, and the composition pipeline turns these into discard-log entries. See
         * `assertBindingShapes` for why this and the list tolerance in `BindingsResolver` belong
         * together.
         */
        const written: Record<string, unknown> = {};
        for (const op of ops) {
            const record = op as unknown as {
                path?: string;
                binding?: unknown;
                elementId?: string;
            };
            if (
                record.elementId === elementId &&
                typeof record.path === "string" &&
                record.binding
            ) {
                written[record.path] = record.binding;
            }
        }
        for (const violation of assertBindingShapes({ inputs: written as never }, inputsAst)) {
            logger.warn(
                `Binding "${violation.path}" declares a ${violation.declared} and holds a ${violation.found}.`
            );
        }

        // Process styles
        for (const key in bindings.styles) {
            ops.push(
                operations.setStyleBinding(elementId, key, {
                    static: bindings.styles[key]
                })
            );
        }

        return ops;
    }

    private getComponentManifest(componentName: string): ComponentManifest {
        const manifest = this.components[componentName];
        if (!manifest) {
            const registered = Object.keys(this.components).join(", ");
            throw new Error(
                `Component "${componentName}" not registered. Registered components: ${registered}`
            );
        }

        return manifest;
    }

    private createElement(componentName: string, parentId: string, slot: string) {
        const element: DocumentElement = {
            type: "Webiny/Element",
            id: generateElementId(),
            parent: { id: parentId, slot },
            component: { name: componentName }
        };

        const componentManifest = this.getComponentManifest(componentName);
        const inputsAst = ComponentManifestToAstConverter.convert(componentManifest.inputs ?? []);

        return {
            element,
            inputsAst,
            componentManifest
        };
    }
}
