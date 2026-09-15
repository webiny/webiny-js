import React from "react";

export const Kbd = ({ children }: { children: React.ReactNode }) => (
    <span
        className="inline-flex items-center justify-center rounded-sm border border-neutral-dimmed bg-neutral-base text-xs text-neutral-muted"
        style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            gap: 2,
            fontFamily: "var(--font-family-mono, monospace)"
        }}
    >
        {children}
    </span>
);
