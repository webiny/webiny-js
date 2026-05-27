import React from "react";

interface PlaceholderProps {
    node: any;
    depth: number;
}

export const Placeholder = ({ depth }: PlaceholderProps) => (
    <div
        className={"bg-primary"}
        style={{
            height: 2,
            zIndex: 999,
            position: "absolute",
            right: 0,
            transform: "translateY(-50%)",
            top: -2,
            left: depth * 24
        }}
    />
);
