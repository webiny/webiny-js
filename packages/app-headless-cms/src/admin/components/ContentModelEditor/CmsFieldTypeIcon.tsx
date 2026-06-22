import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

interface CmsFieldTypeIconProps {
    icon: string;
}

export const CmsFieldTypeIcon = ({ icon }: CmsFieldTypeIconProps) => {
    return <FontAwesomeIcon icon={icon.split("/") as IconProp} />;
};
