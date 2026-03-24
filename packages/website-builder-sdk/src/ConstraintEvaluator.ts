import type {
    ComponentManifest,
    ComponentConstraint,
    ConstraintContext,
    ConstraintElementContext,
    Document,
    DocumentElement
} from "~/types.js";

class ConstraintBlockError extends Error {
    constructor(message: string) {
        super(message);
    }
}

function block(message: string): never {
    throw new ConstraintBlockError(message);
}

export type ConstraintViolation = {
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

    const inputs = document.bindings[element.parent.id]?.inputs;
    if (!inputs) {
        return undefined;
    }

    // Try direct list slot format: binding key = slot name, static = array of IDs.
    // Only when the slot path itself is NOT an indexed sub-key (e.g., "steps", not "steps/0/step").
    const slotName = element.parent.slot;
    if (!/\/\d+\//.test(slotName)) {
        const directBinding = inputs[slotName];
        if (directBinding && Array.isArray(directBinding.static)) {
            const index = directBinding.static.indexOf(element.id);
            if (index !== -1) {
                return { index, count: directBinding.static.length };
            }
        }
    }

    // Fall back to indexed sub-key format: steps/0/step, steps/1/step, etc.
    const pattern = buildSlotPattern(slotName);
    if (!pattern) {
        return undefined;
    }

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

export function buildElementContext(
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

export interface InternalAncestor {
    element: DocumentElement;
    manifest: ComponentManifest;
}

export function buildAncestors(
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

function hasDescendantWithTag(
    document: Document,
    components: Record<string, ComponentManifest>,
    elementId: string,
    tag: string
): boolean {
    for (const id in document.elements) {
        const el = document.elements[id];
        if (id === elementId) {
            continue;
        }
        // Walk up parent chain to see if elementId is an ancestor.
        let current = el.parent?.id ? document.elements[el.parent.id] : undefined;
        let isDescendant = false;
        while (current) {
            if (current.id === elementId) {
                isDescendant = true;
                break;
            }
            current = current.parent?.id ? document.elements[current.parent.id] : undefined;
        }
        if (!isDescendant) {
            continue;
        }
        const elManifest = components[el.component.name];
        if (elManifest?.tags?.includes(tag)) {
            return true;
        }
    }
    return false;
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
            tags: componentManifest.tags ?? [],
            // During placement, the element doesn't exist yet — position is unknown.
            getParent: () => parentCtx,
            childIndex: () => -1,
            childCount: () => -1,
            isLastChild: () => false,
            isFirstChild: () => false
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
        // Element doesn't exist yet during placement — no descendants to check.
        hasDescendantWithTag: () => false,
        log: (...args: any[]) => console.log(...args),
        block
    };

    const runConstraint = (
        constraint: ComponentConstraint,
        fallbackMessage: string
    ): ConstraintViolation | undefined => {
        try {
            constraint(ctx);
        } catch (err) {
            if (err instanceof ConstraintBlockError) {
                return { message: err.message };
            }
            return {
                message: err instanceof Error && err.message ? err.message : fallbackMessage
            };
        }
        return undefined;
    };

    // Evaluate the placed component's own constraints.
    if (componentManifest.constraints) {
        for (const constraint of componentManifest.constraints) {
            const violation = runConstraint(
                constraint,
                `Cannot place ${componentManifest.label} here.`
            );
            if (violation) {
                return { allowed: false, violation };
            }
        }
    }

    // Evaluate descendantConstraints from all ancestors (including direct parent).
    for (const ancestor of ancestors) {
        if (ancestor.manifest.descendantConstraints) {
            for (const constraint of ancestor.manifest.descendantConstraints) {
                const violation = runConstraint(
                    constraint,
                    `Cannot place ${componentName} inside ${ancestor.manifest.label}.`
                );
                if (violation) {
                    return { allowed: false, violation };
                }
            }
        }
    }

    return { allowed: true };
}

export interface EvaluateDeleteConstraintParams {
    /** The element being deleted */
    elementId: string;
    /** The document */
    document: Document;
    /** All registered component manifests */
    components: Record<string, ComponentManifest>;
}

export function evaluateDeleteConstraint(params: EvaluateDeleteConstraintParams): ConstraintResult {
    const { elementId, document, components } = params;

    const element = document.elements[elementId];
    if (!element) {
        return { allowed: true };
    }

    const manifest = components[element.component.name];
    if (!manifest) {
        return { allowed: true };
    }

    const { canDelete } = manifest;

    // undefined or true → allowed
    if (canDelete === undefined || canDelete === true) {
        return { allowed: true };
    }

    // false → blocked
    if (canDelete === false) {
        return {
            allowed: false,
            violation: {
                message: `${manifest.label} cannot be deleted.`
            }
        };
    }

    // ComponentConstraint → evaluate dynamically
    const parentElement = element.parent?.id ? document.elements[element.parent.id] : undefined;
    const parentCtx = parentElement
        ? buildElementContext(parentElement, components, document)
        : undefined;

    const ancestors = parentElement ? buildAncestors(parentElement, components, document) : [];

    const parentInputs = parentElement ? (document.bindings[parentElement.id]?.inputs ?? {}) : {};

    const slot = element.parent?.slot ?? "";

    const elementCtx = buildElementContext(element, components, document)!;

    const ctx: ConstraintContext = {
        component: elementCtx,
        parent: parentCtx ?? {
            name: "",
            tags: [],
            getParent: () => undefined,
            childIndex: () => -1,
            childCount: () => -1,
            isLastChild: () => false,
            isFirstChild: () => false
        },
        slot,
        isChildOf: (name: string) => parentElement?.component.name === name,
        isDescendantOf: (name: string) => ancestors.some(a => a.manifest.name === name),
        getAncestor: (name: string) => {
            const found = ancestors.find(a => a.manifest.name === name);
            return found ? buildElementContext(found.element, components, document) : undefined;
        },
        hasTag: (tag: string) => manifest.tags?.includes(tag) ?? false,
        slotChildCount: () => {
            const items = parentInputs[slot]?.static;
            return Array.isArray(items) ? items.length : 0;
        },
        countInstances: (name: string) => countInstances(document, name),
        hasDescendantWithTag: (tag: string) =>
            hasDescendantWithTag(document, components, element.id, tag),
        log: (...args: any[]) => console.log(...args),
        block
    };

    const fallbackMessage = `${manifest.label} cannot be deleted.`;
    try {
        canDelete(ctx);
    } catch (err) {
        if (err instanceof ConstraintBlockError) {
            return { allowed: false, violation: { message: err.message } };
        }
        return {
            allowed: false,
            violation: {
                message: err instanceof Error && err.message ? err.message : fallbackMessage
            }
        };
    }

    return { allowed: true };
}
