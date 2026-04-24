import React from "react";

interface DropLineProps {
    label: string;
    top: number;
    left: number;
    width: number;
    visible: boolean;
    dimmed: boolean;
}

export function DropLine({ label, top, width, left, visible, dimmed }: DropLineProps) {
    return (
        <div
            className={"absolute bg-primary left-0 right-0 w-full"}
            style={{
                display: "flex",
                justifyContent: "center",
                top,
                left,
                width,
                height: 4,
                zIndex: 1000,
                visibility: visible ? "visible" : "hidden",
                opacity: dimmed ? 0.5 : 1
            }}
        >
            <span
                className={"absolute bg-primary text-neutral-light"}
                style={{ top: -10, padding: "2px 8px" }}
            >
                {label}
            </span>
        </div>
    );
}
