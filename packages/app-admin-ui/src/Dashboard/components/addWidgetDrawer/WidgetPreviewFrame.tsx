import React from "react";
import { useLayoutEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { cn } from "@webiny/admin-ui";
import { WidgetSketch } from "./WidgetSketch.js";

// The preview renders at a dashboard column's width, then shrinks to the frame's width.
const RENDER_WIDTH = 520;
const FRAME_HEIGHT = 150;

interface WidgetPreviewFrameProps {
    preview?: React.ReactElement;
    // Already on the dashboard; the preview is dimmed to match the disabled "Added" button.
    added: boolean;
}

export const WidgetPreviewFrame = ({ preview, added }: WidgetPreviewFrameProps) => {
    const frameRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);

    useLayoutEffect(() => {
        const frame = frameRef.current;
        if (!frame) {
            return;
        }
        // A preview is a picture: its links and buttons must not take focus or clicks.
        frame.setAttribute("inert", "");

        const fit = () => setScale(frame.clientWidth / RENDER_WIDTH);
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    let content = (
        <div className={"flex h-full items-center justify-center"}>
            <WidgetSketch added={added} />
        </div>
    );
    if (preview) {
        content = (
            <>
                <div
                    className={"origin-top-left p-md"}
                    style={{ width: RENDER_WIDTH, transform: `scale(${scale})` }}
                >
                    {preview}
                </div>
                {/* Taller widgets are cropped; the fade makes the cut look intentional. */}
                <div
                    className={
                        "absolute inset-x-0 bottom-0 h-xl bg-gradient-to-t from-neutral-light"
                    }
                />
            </>
        );
    }

    return (
        <div
            aria-hidden
            ref={frameRef}
            className={cn(
                "pointer-events-none relative overflow-hidden rounded-sm bg-neutral-light",
                "select-none",
                added && "opacity-60"
            )}
            style={{ height: FRAME_HEIGHT }}
        >
            {content}
        </div>
    );
};
