import React from "react";

/** A group's name, as the all-caps eyebrow. */
export const GroupHeading = ({ title }: { title: string }) => (
    <span className="block px-sm-extra pb-xs pt-sm-extra text-sm font-semibold uppercase text-neutral-strong">
        {title}
    </span>
);
