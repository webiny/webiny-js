import { useEffect } from "react";

interface Dimensions {
    width: number;
    height: number;
}

/**
 * Observe DOM elements that affect preview container width/height.
 * Sum dimensions of all `data-affects-preview` elements and execute the callback.
 */
export const useReservedUISpace = (callback: (dimensions: Dimensions) => void) => {
    useEffect(() => {
        const recalculate = () => {
            const elements = document.querySelectorAll("[data-affects-preview]");
            let totalWidth = 0;
            let totalHeight = 0;

            const tracksOf = (el: Element) => {
                const affects = el.getAttribute("data-affects-preview") ?? "";
                return affects.split(",").map(s => s.trim());
            };

            /*
             * An element inside another one that is counted for the same dimension is part of it:
             * an editor panel's content inside the panel, which animates its width.
             */
            const isNested = (el: Element, track: string) => {
                let parent = el.parentElement?.closest("[data-affects-preview]");
                while (parent) {
                    if (tracksOf(parent).includes(track)) {
                        return true;
                    }
                    parent = parent.parentElement?.closest("[data-affects-preview]");
                }
                return false;
            };

            elements.forEach(el => {
                const tracks = tracksOf(el);
                const rect = el.getBoundingClientRect();

                if (tracks.includes("width") && !isNested(el, "width")) {
                    totalWidth += rect.width;
                }

                if (tracks.includes("height") && !isNested(el, "height")) {
                    totalHeight += rect.height;
                }
            });

            callback({ width: totalWidth, height: totalHeight });
        };

        const resizeObserver = new ResizeObserver(recalculate);

        const observeExisting = () => {
            document.querySelectorAll("[data-affects-preview]").forEach(el => {
                resizeObserver.observe(el);
            });
        };

        const mutationObserver = new MutationObserver(observeExisting);
        mutationObserver.observe(document.body, { childList: true, subtree: true });

        observeExisting();
        recalculate();

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [callback]);
};
