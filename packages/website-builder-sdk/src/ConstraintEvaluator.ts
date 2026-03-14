import type {
    ComponentManifest,
    ComponentConstraint,
    ConstraintContext,
    ConstraintElementContext,
    Document,
    DocumentElement,
    InputValueBinding
} from "~/types.js";

export type ConstraintViolation = {
    constraint: ComponentConstraint;
    message: string;
};

export type ConstraintResult = {
    allowed: boolean;
    violation?: ConstraintViolation;
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

    return { element, manifest, inputs };
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
    const { componentName, parentId, slot, document, components } = params;

    const componentManifest = components[componentName];
    if (!componentManifest) {
        return { allowed: true };
    }

    const parentElement = document.elements[parentId];
    if (!parentElement) {
        return { allowed: true };
    }

    const parentCtx = buildElementContext(parentElement, components, document);
    if (!parentCtx) {
        return { allowed: true };
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
        isChildOf: (name: string) => parentCtx.manifest.name === name,
        isDescendantOf: (name: string) => ancestors.some(a => a.manifest.name === name),
        slotChildCount: () => {
            const items = parentCtx.inputs[slot]?.static;
            return Array.isArray(items) ? items.length : 0;
        },
        log: (...args: any[]) => console.log(...args)
    };

    const evaluateConstraint = (
        constraint: ComponentConstraint,
        fallbackMessage: string
    ): ConstraintViolation | undefined => {
        try {
            if (!constraint.check(ctx)) {
                return {
                    constraint,
                    message: constraint.message ?? fallbackMessage
                };
            }
        } catch (err) {
            return {
                constraint,
                message:
                    err instanceof Error && err.message
                        ? err.message
                        : (constraint.message ?? fallbackMessage)
            };
        }
        return undefined;
    };

    // Evaluate the placed component's own constraints.
    if (componentManifest.constraints) {
        for (const constraint of componentManifest.constraints) {
            const violation = evaluateConstraint(constraint, `Cannot place ${componentName} here`);
            if (violation) {
                return { allowed: false, violation };
            }
        }
    }

    return { allowed: true };
}
