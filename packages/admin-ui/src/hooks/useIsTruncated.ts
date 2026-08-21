import { useEffect, useState } from "react";

/**
 * Tracks whether an element's content overflows horizontally, which is what CSS truncation
 * (`text-overflow: ellipsis`) hides. Use it to expose the full value some other way - typically
 * via a tooltip - but only when it's actually cut off.
 *
 * The element is tracked via a callback ref, so remounting it (e.g. when it gets wrapped in a
 * tooltip trigger) re-attaches the observer instead of leaving it on a detached node.
 *
 * @param content Value rendered inside the element. Changing it triggers a re-measure, which a
 * `ResizeObserver` alone wouldn't catch (the element's own box doesn't change).
 */
export const useIsTruncated = <TElement extends HTMLElement = HTMLElement>(content?: unknown) => {
    const [element, setElement] = useState<TElement | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        if (!element) {
            setIsTruncated(false);
            return;
        }

        const measure = () => setIsTruncated(element.scrollWidth > element.clientWidth);

        measure();

        if (typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver(measure);
        observer.observe(element);

        return () => observer.disconnect();
    }, [element, content]);

    return { ref: setElement, isTruncated };
};
