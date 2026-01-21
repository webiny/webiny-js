import React from "react";
import type { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { normalizeIcon } from "~/utils/normalizeIcon.js";

interface TemplateIconProps {
    icon: string;
    size?: FontAwesomeIconProps["size"];
    style?: React.CSSProperties;
}

export const TemplateIcon = ({ icon, size, style }: TemplateIconProps) => {
    const faIcon = normalizeIcon(icon);

    return faIcon ? (
        <FontAwesomeIcon
            className={"text-neutral-xstrong"}
            icon={faIcon}
            size={size}
            style={style}
        />
    ) : null;
};
