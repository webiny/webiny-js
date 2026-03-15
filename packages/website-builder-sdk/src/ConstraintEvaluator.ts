import type {
    ComponentManifest,
    ComponentConstraint,
    ConstraintContext,
    ConstraintElementContext,
    Document,
    DocumentElement
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

/**
 * Build a regex pattern from a slot path, replacing the numeric index with \d+.
 * E.g., "steps/2/step" → /^steps\/\d+\/step$/
 * Returns undefined if the slot has no index segment.
 */
function buildSlotPattern(slot: string): RegExp | undefined {
    const match = slot.match(/\/(\d+)\//);
    if (!match) {
        return undefined;
    }
    return new RegExp("^" + slot.replace(/\/\d+\//, "/\\d+/") + "$");
}

/**
 * Find the actual index and sibling count for an element in its parent's bindings.
 * Instead of trusting element.parent.slot (which may be stale after reordering),
 * we scan the parent's binding keys to find which slot holds this element's ID.
 * Returns { index, count } or undefined if not in a list slot.
 */
function findChildPosition(
    element: DocumentElement,
    document: Document
): { index: number; count: number } | undefined {
    if (!element.parent?.id || !element.parent.slot) {
        return undefined;
    }

    const pattern = buildSlotPattern(element.parent.slot);
    if (!pattern) {
        return undefined;
    }

    const inputs = document.bindings[element.parent.id]?.inputs;
    if (!inputs) {
        return undefined;
    }

    // Collect all sibling slot keys matching the pattern, sorted by index.
    const siblingKeys: { key: string; idx: number }[] = [];
    for (const key in inputs) {
        if (pattern.test(key)) {
            const m = key.match(/\/(\d+)\//);
            if (m) {
                siblingKeys.push({ key, idx: parseInt(m[1], 10) });
            }
        }
    }
    siblingKeys.sort((a, b) => a.idx - b.idx);

    // Find which slot actually contains this element's ID.
    const position = siblingKeys.findIndex(({ key }) => {
        const val = inputs[key]?.static;
        if (Array.isArray(val)) {
            return val.includes(element.id);
        }
        return val === element.id;
    });

    if (position === -1) {
        return undefined;
    }

    return { index: position, count: siblingKeys.length };
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

    return {
        name: element.component.name,
        tags: manifest.tags ?? [],
        getParent() {
            if (!element.parent?.id) {
                return undefined;
            }
            const parentEl = document.elements[element.parent.id];
            if (!parentEl) {
                return undefined;
            }
            return buildElementContext(parentEl, components, document);
        },
        childIndex() {
            const pos = findChildPosition(element, document);
            return pos ? pos.index : -1;
        },
        childCount() {
            const pos = findChildPosition(element, document);
            return pos ? pos.count : -1;
        },
        isLastChild() {
            const pos = findChildPosition(element, document);
            return pos !== undefined && pos.index === pos.count - 1;
        },
        isFirstChild() {
            const pos = findChildPosition(element, document);
            return pos !== undefined && pos.index === 0;
        }
    };
}

interface InternalAncestor {
    element: DocumentElement;
    manifest: ComponentManifest;
}

function buildAncestors(
    parentElement: DocumentElement,
    components: Record<string, ComponentManifest>,
    document: Document
): InternalAncestor[] {
    const ancestors: InternalAncestor[] = [];
    let current: DocumentElement | undefined = parentElement;

    while (current) {
        const manifest = components[current.component.name];
        if (manifest) {
            ancestors.push({ element: current, manifest });
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

    const parentInputs = document.bindings[parentElement.id]?.inputs ?? {};

    const ctx: ConstraintContext = {
        component: {
            name: componentManifest.name,
            tags: componentManifest.tags ?? []
        },
        parent: parentCtx,
        slot,
        isChildOf: (name: string) => parentElement.component.name === name,
        isDescendantOf: (name: string) => ancestors.some(a => a.manifest.name === name),
        getAncestor: (name: string) => {
            const found = ancestors.find(a => a.manifest.name === name);
            return found ? buildElementContext(found.element, components, document) : undefined;
        },
        hasTag: (tag: string) => componentManifest.tags?.includes(tag) ?? false,
        slotChildCount: () => {
            const items = parentInputs[slot]?.static;
            return Array.isArray(items) ? items.length : 0;
        },
        countInstances: (name: string) => countInstances(document, name),
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

    // Evaluate descendantConstraints from all ancestors (including direct parent).
    for (const ancestor of ancestors) {
        if (ancestor.manifest.descendantConstraints) {
            for (const constraint of ancestor.manifest.descendantConstraints) {
                const violation = evaluateConstraint(
                    constraint,
                    `Cannot place ${componentName} inside ${ancestor.manifest.name}`
                );
                if (violation) {
                    return { allowed: false, violation };
                }
            }
        }
    }

    return { allowed: true };
}
