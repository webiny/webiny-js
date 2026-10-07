import React from "react";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ITemplateIcon } from "~/features/formModel/index.js";

interface TemplateIconProps {
    icon: ITemplateIcon | undefined;
    size: number;
}

export const TemplateIcon = ({ icon, size }: TemplateIconProps) => {
    if (!icon) {
        return null;
    }

    return (
        <FontAwesomeIcon
            className={"text-neutral-xstrong"}
            icon={icon.name.split("/") as IconProp}
            style={{ width: size, height: size }}
        />
    );
};
