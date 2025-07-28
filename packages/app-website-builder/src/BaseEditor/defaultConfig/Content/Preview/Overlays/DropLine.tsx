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
            className={"wby-absolute wby-bg-primary-default wby-left-0 wby-right-0 wby-w-full"}
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
                className={"wby-absolute wby-bg-primary-default wby-text-neutral-light"}
                style={{ top: -10, padding: "2px 8px" }}
            >
                {label}
            </span>
        </div>
    );
}
