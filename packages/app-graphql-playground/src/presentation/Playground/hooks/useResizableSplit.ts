import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

const MIN_PANE_PCT = 20;

export function useResizableSplit() {
    const splitRef = useRef<HTMLDivElement>(null);
    const [editorPct, setEditorPct] = useState(50);
    const isDragging = useRef(false);

    const handleDividerMouseDown = useCallback((ev: React.MouseEvent) => {
        ev.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    useEffect(() => {
        const onMouseMove = (ev: MouseEvent) => {
            if (!isDragging.current || !splitRef.current) {
                return;
            }
            const rect = splitRef.current.getBoundingClientRect();
            const pct = ((ev.clientX - rect.left) / rect.width) * 100;
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
