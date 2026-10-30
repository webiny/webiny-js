import { useCallback, useRef } from "react";

/**
 * A modal `Dialog` locks scrolling by preventing every `wheel` and `touchmove` event that lands
 * outside of its content. The listener sits on `document`, so layers that are portaled to
 * `document.body` - popovers and the lists they render - count as "outside" and stop scrolling
 * while the dialog is open.
 *
 * Stopping those events on the layer itself keeps them away from the `document` listener: the
 * browser scrolls the layer as it normally would, and the lock still holds everywhere else.
 *
 * Attach the returned callback ref to the element whose subtree must remain scrollable. It has to
 * be a callback ref, because layers like the popover mount their element after the first render.
 */
export const useEscapeScrollLock = <T extends HTMLElement>() => {
    const detach = useRef<(() => void) | null>(null);

    return useCallback((element: T | null) => {
        if (detach.current) {
            detach.current();
            detach.current = null;
        }

        if (!element) {
            return;
        }

        const stopPropagation = (event: Event) => event.stopPropagation();

        element.addEventListener("wheel", stopPropagation);
        element.addEventListener("touchmove", stopPropagation);

        detach.current = () => {
            element.removeEventListener("wheel", stopPropagation);
            element.removeEventListener("touchmove", stopPropagation);
        };
    }, []);
};
