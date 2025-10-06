import React from "react";
import type { CmsGroup } from "~/types.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IconProps {
    group: CmsGroup;
}

export const Icon = ({ group }: IconProps) => {
    return (
        <FontAwesomeIcon
            style={{ color: "var(--mdc-theme-text-secondary-on-background)" }}
            icon={(group.icon || "").split("/") as IconProp}
        />
    );
};
