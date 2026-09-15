import React from "react";

export const GroupHeading = ({ title }: { title: string }) => (
    <span
        className="block px-sm pb-xs pt-sm text-xs font-semibold uppercase text-neutral-muted"
        style={{ letterSpacing: ".06em" }}
    >
        {title}
    </span>
);
