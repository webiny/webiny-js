import React from "react";
import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

interface TemplateIconProps {
    icon: string;
}

export const TemplateIcon = ({ icon }: TemplateIconProps) => {
    const faIcon = icon ? (icon.split("/") as FontAwesomeIconProps["icon"]) : undefined;

    return faIcon ? <FontAwesomeIcon icon={faIcon} /> : null;
};
