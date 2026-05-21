const GAP = 10;

export function setFloatingElemPosition(
    basePosition: Range | null,
    elementToPosition: HTMLElement
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

        const left = rangeRect.left - containerRect.left;
        let top = rangeRect.bottom + GAP - containerRect.top;

        const elHeight = elementToPosition.offsetHeight;
        const viewportHeight = window.innerHeight;
        if (rangeRect.bottom + GAP + elHeight > viewportHeight - GAP) {
            top = rangeRect.top - elHeight - GAP - containerRect.top;
        }

        Object.assign(elementToPosition.style, {
            position: "absolute",
            left: `${left}px`,
            top: `${top}px`,
            transform: "none"
        });
    }, 10);
}
