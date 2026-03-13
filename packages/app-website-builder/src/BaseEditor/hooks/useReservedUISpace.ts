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

            elements.forEach(el => {
                const affects = el.getAttribute("data-affects-preview") ?? "";
                const tracks = affects.split(",").map(s => s.trim());
                const rect = el.getBoundingClientRect();

                if (tracks.includes("width")) {
                    totalWidth += rect.width;
                }

                if (tracks.includes("height")) {
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
