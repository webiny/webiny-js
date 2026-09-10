import React from "react";

/**
 * Consistent section heading for the image editor. Uses the primary (darkest)
 * text token so it reads as a heading, distinct from the muted body/caption text.
 */
export const SectionLabel = ({ children }: { children: React.ReactNode }) => {
    return <div className={"text-sm font-semibold text-neutral-primary"}>{children}</div>;
};
