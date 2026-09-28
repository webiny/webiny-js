import type { DocumentElementBindings } from "./types.js";
import type { InputAstNode } from "./ComponentManifestToAstConverter.js";

/**
 * A binding whose value does not match the shape its input declares.
 */
export interface BindingShapeViolation {
    path: string;
    /** What the input declares. */
    declared: "list" | "scalar";
    /** What the binding holds. */
    found: "list" | "scalar";
    value: unknown;
}

/**
 * Checks a built element's bindings against the shapes its inputs declare.
 *
 * **Deliberately on the BINDINGS, not on the inputs handed to the factory.** A check on the inputs
 * covers only the shapes that intermediate happens to carry, and the defect this exists for lived
 * entirely downstream of it: the composition passed a correct array, and the traverser collapsed it
 * to its last item while writing the bindings. An input-level check passed on all 34 occurrences
 * while every one of those pages was failing to render. `stripInventedBindings` in the composition
 * pipeline learned the same thing about invented destinations and says so in its own comment; this is
 * that lesson paid for a second time.
 *
 * **READ THIS WITH the list tolerance in `BindingsResolver`, and do not remove one without the
 * other.** This is the alarm: it fires where the bad write happens, so a writer that regresses is
 * found rather than absorbed. The tolerance there is the recovery for documents already stored. Keep
 * only the tolerance and a broken writer lives indefinitely, because nothing downstream ever looks
 * wrong; keep only the alarm and every already-stored page stays broken.
 */
export const assertBindingShapes = (
    bindings: DocumentElementBindings,
    inputAst: InputAstNode[]
): BindingShapeViolation[] => {
    const violations: BindingShapeViolation[] = [];
    const inputs = bindings?.inputs ?? {};

    const check = (nodes: InputAstNode[], prefix: string[]): void => {
        for (const node of nodes) {
            const path = [...prefix, node.name].join("/");

            if (node.children.length > 0) {
                // An object list is stored element-wise (`rows/0/label`), so its own path holds no
                // value to check; its children are checked under each index that exists.
                if (node.list) {
                    for (const index of indexesUnder(path, inputs)) {
                        check(node.children, [...prefix, `${node.name}/${index}`]);
                    }
                    continue;
                }
                check(node.children, [...prefix, node.name]);
                continue;
            }

            if (node.list) {
                /*
                 * A scalar list is correct in either of two stored shapes: element-wise `name/0`,
                 * `name/1`, … or a single binding holding an array. Both are what the resolver reads.
                 * A single binding holding a scalar is the broken one.
                 */
                if (indexesUnder(path, inputs).length > 0) {
                    continue;
                }
                const binding = inputs[path];
                if (!binding || !("static" in binding)) {
                    continue;
                }
                const value = binding.static;
                if (value === undefined || value === null || Array.isArray(value)) {
                    continue;
                }
                violations.push({ path, declared: "list", found: "scalar", value });
                continue;
            }

            const binding = inputs[path];
            if (binding && "static" in binding && Array.isArray(binding.static)) {
                violations.push({ path, declared: "scalar", found: "list", value: binding.static });
            }
        }
    };

    check(inputAst, []);
    return violations;
};

/** The indexes stored under a list path, from `name/0`, `name/1`, … */
const indexesUnder = (path: string, inputs: Record<string, unknown>): number[] => {
    const seen = new Set<number>();
    const prefix = `${path}/`;
    for (const key of Object.keys(inputs)) {
        if (!key.startsWith(prefix)) {
            continue;
        }
        const index = Number.parseInt(key.slice(prefix.length).split("/")[0], 10);
        if (Number.isInteger(index)) {
            seen.add(index);
        }
    }
    return [...seen].sort((a, b) => a - b);
};
