import { computePosition, flip, offset, shift } from "@floating-ui/dom";

const GAP = 10;

export function setFloatingElemPosition(
    basePosition: Range | null,
    elementToPosition: HTMLElement
): void {
    // A small timeout gives enough time for DOM to update and provides us with correct bounding rect values.
    setTimeout(() => {
        if (basePosition === null) {
            elementToPosition.style.transform = "translate(-10000px, -10000px)";
            return;
        }

        const virtualElement = {
            getBoundingClientRect: () => basePosition.getBoundingClientRect()
        };

        computePosition(virtualElement, elementToPosition, {
            placement: "bottom",
            middleware: [
                offset(GAP), // adds gap between anchor and popup
                flip(), // switches to the opposite side if no room (bottom → top)
                shift({ padding: GAP }) // slides along the axis to stay within viewport
            ]
        }).then(({ x, y }) => {
            elementToPosition.style.transform = `translate(${x}px, ${y}px)`;
        });
    }, 10);
}
