import { generateAlphaNumericLowerCaseId } from "@webiny/utils/generateId";
import type {
    DocumentElement,
    ComponentManifest,
    InputValueBinding,
    StyleValueBinding
} from "~/sdk/types";
import { type IDocumentOperation, DocumentOperations } from "./documentOperations";
import {
    ComponentManifestToAstConverter,
    type InputAstNode
} from "./ComponentManifestToAstConverter";
import { ComponentInputTraverser } from "./ComponentInputTraverser";

interface CreateElementParams {
    componentName: string;
    parentId: string;
    slot: string;
    index: number;
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
    addToParent: (element: DocumentElement, index: number) => IDocumentOperation;
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
    addToParent: (element: DocumentElement, index: number) => {
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
    }: CreateElementParams) {
        const { element, componentManifest, inputsAst } = this.createElement(
            componentName,
            parentId,
            slot
        );

        const documentOps: IDocumentOperation[] = [
            defaultOperations.addElement(element),
            defaultOperations.addToParent(element, index)
        ];

        documentOps.push(
            ...this.generateOperations({
                element,
                inputsAst,
                bindings: {
                    inputs: bindings?.inputs ?? componentManifest.defaults?.inputs ?? {},
                    styles: bindings?.styles ?? componentManifest.defaults?.styles ?? {},
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
                    index: isList ? this.extractIndex(path) : 0,
                    slot: path,
                    parentId: elementId,
                    bindings: value.params
                });

                const newElementId = newElement.element.id;

                ops.push(
                    ...newElement.operations,
                    operations.setInputBinding(elementId, path, {
                        id: generateAlphaNumericLowerCaseId(),
                        static: node.list ? [newElementId] : newElementId,
                        type: node.type,
                        list: node.list
                    })
                );
            } else if (isObject && isList) {
                return;
            } else {
                ops.push(
                    operations.setInputBinding(elementId, path, {
                        id: generateAlphaNumericLowerCaseId(),
                        static: ignoreDefaultValues ? undefined : value ?? node.input.defaultValue,
                        type: node.type,
                        list: node.list
                    })
                );
            }
        });

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
            throw new Error(`Component "${componentName}" not registered.`);
        }

        return manifest;
    }

    private extractIndex(path: string): number {
        const match = path.match(/\/(\d+)\//);
        return match ? parseInt(match[1], 10) : 0;
    }

    private createElement(componentName: string, parentId: string, slot: string) {
        const element: DocumentElement = {
            type: "Webiny/Element",
            id: generateAlphaNumericLowerCaseId(),
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
