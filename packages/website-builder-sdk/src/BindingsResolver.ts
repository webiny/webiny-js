import { toJS } from "mobx";
import type {
    ComponentInput,
    DocumentElement,
    DocumentElementBindings,
    DocumentElementStyleBindings,
    DocumentState,
    ResolvedElement,
    SerializableCSSStyleDeclaration,
    ValueBinding
} from "~/types.js";
import type { InputAstNode } from "./ComponentManifestToAstConverter.js";

export interface OnResolved {
    (value: any, input: ComponentInput): any;
}

export type ResolveElementParams = {
    element: DocumentElement;
    elementBindings: DocumentElementBindings;
    inputAst: InputAstNode[];
    onResolved?: OnResolved;
};

export class BindingsResolver {
    private readonly state: DocumentState;

    constructor(state: DocumentState) {
        this.state = state;
    }

    public resolveElement({
        element,
        elementBindings,
        inputAst,
        onResolved
    }: ResolveElementParams): ResolvedElement[] {
        const repeatBindingArray = elementBindings.$repeat;

        if (repeatBindingArray) {
            const items = this.resolveBinding(repeatBindingArray, { state: toJS(this.state) });

            if (!Array.isArray(items)) {
                return [];
            }

            return items.map(item => {
                return this.resolveSingleInstance(
                    element,
                    elementBindings,
                    item,
                    inputAst,
                    onResolved
                );
            });
        }

        return [
            this.resolveSingleInstance(element, elementBindings, undefined, inputAst, onResolved)
        ];
    }

    private resolveSingleInstance(
        element: DocumentElement,
        elementBindings: DocumentElementBindings,
        item: Record<string, any> | undefined,
        inputAst: InputAstNode[],
        onResolved?: OnResolved
    ): ResolvedElement {
        const resolvedElement: ResolvedElement = {
            id: element.id,
            inputs: {},
            styles: {}
        };

        const context = { state: this.state, $: item };
        const bindings = elementBindings.inputs ?? {};

        const resolveInputsFromAst = (
            nodes: InputAstNode[],
            prefix: string[],
            target: Record<string, any>
        ) => {
            for (const node of nodes) {
                const pathParts = [...prefix, node.name];
                const path = pathParts.join("/");
                const binding = bindings[path];
                const value = this.resolveBinding(binding, context) ?? node.input.defaultValue;

                const finalValue = onResolved ? onResolved(value, node.input) : value;

                if (node.children.length > 0) {
                    if (node.list) {
                        const uniqueIndexes = this.getUniqueIndexesFromPath(path, bindings);

                        target[node.name] = uniqueIndexes.map(index => {
                            const childTarget: Record<string, any> = {};
                            resolveInputsFromAst(
                                node.children,
                                [...pathParts.slice(0, -1), `${node.name}/${index}`],
                                childTarget
                            );
                            return childTarget;
                        });
                    } else {
                        const childTarget: Record<string, any> = {};
                        resolveInputsFromAst(node.children, pathParts, childTarget);
                        target[node.name] = childTarget;
                    }
                } else if (node.list) {
                    // List node with no children (e.g., slot or primitive list)
                    const uniqueIndexes = this.getUniqueIndexesFromPath(path, bindings);

                    // If binding is e.g., `leftColumn/0`, we'll have `0` in unique indexes.
                    if (uniqueIndexes.length > 0) {
                        target[node.name] = uniqueIndexes.map(index => {
                            const binding = bindings[`${node.name}/${index}`];
                            const value =
                                this.resolveBinding(binding, context) ?? node.input.defaultValue;
                            return onResolved ? onResolved(value, node.input) : value;
                        });
                    } else {
                        // If binding is a simple `children`, we simply assign the resolved value.
                        target[node.name] = finalValue;
                    }
                } else if (finalValue !== undefined) {
                    target[node.name] = finalValue;
                }
            }
        };

        resolveInputsFromAst(inputAst, [], resolvedElement.inputs);

        // Resolve styles
        const styles: DocumentElementStyleBindings = elementBindings.styles
            ? elementBindings.styles ?? {}
            : {};

        const resolvedStyles: SerializableCSSStyleDeclaration = {};

        for (const [path, binding] of Object.entries(styles)) {
            if (binding) {
                // @ts-expect-error We're positive this is correct.
                resolvedStyles[path] = this.resolveBinding(binding, context);
            }
        }

        return {
            ...resolvedElement,
            styles: resolvedStyles
        };
    }

    private getUniqueIndexesFromPath(flatKey: string, bindings: DocumentElementBindings) {
        const pattern = new RegExp(`^${flatKey}\\/(\\d+)`);

        const indexes = Object.keys(bindings).reduce((acc: number[], key) => {
            const match = key.match(pattern);
            if (match) {
                acc.push(parseInt(match[1], 10));
            }
            return acc;
        }, []);

        return Array.from(new Set(indexes)).sort((a, b) => a - b);
    }

    private resolveBinding(binding: ValueBinding | undefined, context: Record<string, any>): any {
        if (!binding) {
            return undefined;
        }

        if (binding.expression) {
            return this.evaluateExpression(binding.expression, context);
        }

        if (binding.static) {
            return binding.static;
        }

        return undefined;
    }

    private evaluateExpression(expression: string | undefined, context: Record<string, any> = {}) {
        if (!expression || expression === "$noop") {
            return undefined;
        }

        try {
            let finalExpression = expression.trim();

            if (finalExpression.startsWith("$state")) {
                finalExpression = finalExpression.replace(/^\$state/, "state");
            }

            finalExpression = finalExpression.replace(/\.([0-9]+)/g, "[$1]");

            const scopedFn = new Function(...Object.keys(context), `return ${finalExpression};`);
            return scopedFn(...Object.values(context));
        } catch {
            return undefined;
        }
    }
}
