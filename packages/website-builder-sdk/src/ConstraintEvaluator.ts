import { toJS } from "mobx";
import type {
    ComponentManifest,
    ComponentConstraint,
    ConstraintContext,
    ConstraintElementContext,
    Document,
    DocumentElement,
    InputValueBinding
} from "~/types.js";
import { functionConverter } from "~/FunctionConverter.js";

export type ConstraintViolation = {
    constraint: ComponentConstraint;
    message: string;
};

export type ConstraintResult = {
    allowed: boolean;
    violations: ConstraintViolation[];
};

export interface EvaluateConstraintsParams {
    /** The component being placed */
    componentName: string;
    /** Target parent element ID */
    parentId: string;
    /** Target slot */
    slot: string;
    /** The document */
    document: Document;
    /** All registered component manifests */
    components: Record<string, ComponentManifest>;
}

function buildElementContext(
    element: DocumentElement,
    components: Record<string, ComponentManifest>,
    document: Document
): ConstraintElementContext | undefined {
    const manifest = components[element.component.name];
    if (!manifest) {
        return undefined;
    }

    const inputs: Record<string, InputValueBinding> = document.bindings[element.id]?.inputs ?? {};

    return { element, manifest: toJS(manifest), inputs };
}

function buildAncestors(
    parentElement: DocumentElement,
    components: Record<string, ComponentManifest>,
    document: Document
): ConstraintElementContext[] {
    const ancestors: ConstraintElementContext[] = [];
    let current: DocumentElement | undefined = parentElement;

    while (current) {
        const ctx = buildElementContext(current, components, document);
        if (ctx) {
            ancestors.push(ctx);
        }

        if (current.parent?.id) {
            current = document.elements[current.parent.id];
        } else {
            break;
        }
    }

    return ancestors;
}

/**
 * Resolve the check function from a constraint. It may be a real function (in tests or
 * before serialization) or a serialized string (after cross-boundary transport).
 */
function resolveCheck(constraint: ComponentConstraint): (ctx: ConstraintContext) => boolean {
    if (typeof constraint.check === "function") {
        return constraint.check;
    }
    // Serialized string — deserialize back to a function.
    return functionConverter.deserialize(constraint.check as unknown as string);
}

function countInstances(document: Document, componentName: string): number {
    let count = 0;
    for (const id in document.elements) {
        if (document.elements[id].component.name === componentName) {
            count++;
        }
    }
    return count;
}

export function evaluateConstraints(params: EvaluateConstraintsParams): ConstraintResult {
    console.log("evaluateConstraints", params);
    const { componentName, parentId, slot, document, components } = params;

    const violations: ConstraintViolation[] = [];

    const componentManifest = components[componentName];
    if (!componentManifest) {
        return { allowed: true, violations: [] };
    }

    const parentElement = document.elements[parentId];
    if (!parentElement) {
        return { allowed: true, violations: [] };
    }

    const parentCtx = buildElementContext(parentElement, components, document);
    if (!parentCtx) {
        return { allowed: true, violations: [] };
    }

    const ancestors = buildAncestors(parentElement, components, document);

    const ctx: ConstraintContext = {
        component: componentManifest,
        parent: parentCtx,
        slot,
        ancestors,
        document: {
            elements: document.elements,
            bindings: document.bindings,
            countInstances: (name: string) => countInstances(document, name)
        },
        log: (...args: any[]) => console.log("[constraint]", ...args)
    };

    console.log("ctx", ctx);

    // Evaluate the placed component's own constraints.
    if (componentManifest.constraints) {
        for (const constraint of componentManifest.constraints) {
            try {
                const check = resolveCheck(constraint);
                if (!check(ctx)) {
                    violations.push({
                        constraint,
                        message: constraint.message ?? `Cannot place ${componentName} here`
                    });
                }
            } catch {
                violations.push({
                    constraint,
                    message: constraint.message ?? `Cannot place ${componentName} here`
                });
            }
        }
    }

    // Evaluate the parent component's constraints.
    const parentManifest = parentCtx.manifest;
    if (parentManifest.constraints) {
        for (const constraint of parentManifest.constraints) {
            try {
                const check = resolveCheck(constraint);
                if (!check(ctx)) {
                    violations.push({
                        constraint,
                        message:
                            constraint.message ??
                            `${parentManifest.name} does not accept ${componentName}`
                    });
                }
            } catch {
                violations.push({
                    constraint,
                    message:
                        constraint.message ??
                        `${parentManifest.name} does not accept ${componentName}`
                });
            }
        }
    }

    return {
        allowed: violations.length === 0,
        violations
    };
}
