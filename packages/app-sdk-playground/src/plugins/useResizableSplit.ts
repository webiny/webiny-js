import { useCallback, useEffect, useRef, useState } from "react";
import { MIN_PANE_PCT } from "./types.js";

export function useResizableSplit() {
    const splitRef = useRef<HTMLDivElement | null>(null);
    const [editorPct, setEditorPct] = useState(60);
    const isDragging = useRef(false);

    const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !splitRef.current) {
                return;
            }
            const rect = splitRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setEditorPct(Math.min(100 - MIN_PANE_PCT, Math.max(MIN_PANE_PCT, pct)));
        };

        const onMouseUp = () => {
            if (!isDragging.current) {
                return;
            }
            isDragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    return {
        splitRef,
        editorPct,
        handleDividerMouseDown
    };
}
