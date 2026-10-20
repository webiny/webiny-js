import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { MIN_COLUMN_WIDTH } from "./layoutConstants.js";

/*
 * Measures the dashboard and works out how many of the chosen columns fit. When fewer fit, the
 * dashboard shows `visibleCount` columns and `allFit` is false (Customize mode needs all of them).
 */
export const useColumnsThatFit = (columnCount: number) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }
        setWidth(node.clientWidth);
        const observer = new ResizeObserver(entries => {
            setWidth(entries[0].contentRect.width);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    let fitCount = columnCount;
    if (width > 0) {
        const columnsThatFit = Math.floor(width / MIN_COLUMN_WIDTH);
        fitCount = Math.max(1, columnsThatFit);
    }
    const visibleCount = Math.min(columnCount, fitCount);

    return { ref, visibleCount, allFit: visibleCount === columnCount };
};
