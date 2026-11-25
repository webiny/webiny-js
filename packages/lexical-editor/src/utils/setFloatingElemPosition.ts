const GAP = 10;

export interface FloatingElemPositionOptions {
    /** Below the range (the default) or above it; flips when there's no room on that side. */
    placement?: "below" | "above";
}

export function setFloatingElemPosition(
    basePosition: Range | null,
    elementToPosition: HTMLElement,
    { placement = "below" }: FloatingElemPositionOptions = {}
): void {
    setTimeout(() => {
        if (basePosition === null) {
            Object.assign(elementToPosition.style, {
                position: "fixed",
                left: "-10000px",
                top: "-10000px",
                transform: "none"
            });
            return;
        }

        const rangeRect = basePosition.getBoundingClientRect();
        const containerRect = elementToPosition.offsetParent?.getBoundingClientRect() ?? {
            left: 0,
            top: 0
        };

        const elWidth = elementToPosition.offsetWidth;
        const elHeight = elementToPosition.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = rangeRect.left - containerRect.left;
        const below = rangeRect.bottom + GAP - containerRect.top;
        const above = rangeRect.top - elHeight - GAP - containerRect.top;
        let top = below;

        if (rangeRect.left + elWidth > viewportWidth - GAP) {
            left = viewportWidth - elWidth - GAP - containerRect.left;
        }

        if (placement === "above") {
            top = rangeRect.top - elHeight - GAP < GAP ? below : above;
        } else if (rangeRect.bottom + GAP + elHeight > viewportHeight - GAP) {
            top = above;
        }

        Object.assign(elementToPosition.style, {
            position: "absolute",
            left: `${left}px`,
            top: `${top}px`,
            transform: "none"
        });
    }, 10);
}
