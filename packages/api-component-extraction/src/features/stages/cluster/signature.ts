import { createHash } from "node:crypto";
import type { SectionShape, TypeNode } from "~/domain/artifacts.js";

/**
 * The structural signature of a section — a real SHA-256 digest, load-bearing across runs.
 *
 * Derived from exactly three things: the element-type tree shape, the geometry class, and the sorted
 * token set. Text content and image URLs are excluded by construction (they are not in `SectionShape`),
 * so the same section on two pages — different copy, different hero image — produces the same signature
 * and clusters together, and an override reattaches to it in a later run.
 *
 * This is deliberately NOT `hashObject` from `website-builder-sdk`: that is a 32-bit non-cryptographic
 * rolling hash for change detection and would collide across the few hundred sections a run produces.
 */
const serializeTypeTree = (node: TypeNode): string =>
    `${node.tag}[${node.children.map(serializeTypeTree).join("")}]`;

export const structuralSignature = (shape: SectionShape): string => {
    const canonical = JSON.stringify({
        tree: serializeTypeTree(shape.typeTree),
        geometry: shape.geometryClass,
        // Sorted so token order never changes the signature.
        tokens: [...shape.tokens].sort()
    });
    return createHash("sha256").update(canonical).digest("hex");
};
