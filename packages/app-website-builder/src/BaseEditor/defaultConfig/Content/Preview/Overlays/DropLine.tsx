import React from "react";

interface DropLineProps {
    label: string;
    top: number;
    visible: boolean;
    dimmed: boolean;
}

export function DropLine({ label, top, visible, dimmed }: DropLineProps) {
    return (
        <div
            className={"absolute bg-primary left-0 right-0 w-full"}
            style={{
                display: "flex",
                justifyContent: "center",
                top,
                height: 4,
                zIndex: 10,
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
