import type { OutlineElement } from "./pageOutline.js";

/**
 * The outline as indented lines, "<id> <component>", with the slot when it is not `children`. Lines
 * rather than nested objects: the same tree in about half the characters, and the page context is
 * capped.
 */
export const outlineLines = (elements: OutlineElement[], depth = 0): string[] => {
    return elements.flatMap(element => {
        const slot = element.slot === "children" ? "" : ` in ${element.slot}`;
        const line = `${"  ".repeat(depth)}${element.id} ${element.component}${slot}`;
        return [line, ...outlineLines(element.children, depth + 1)];
    });
};
