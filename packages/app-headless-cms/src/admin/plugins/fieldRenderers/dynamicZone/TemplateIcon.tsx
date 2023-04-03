import React from "react";
import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

interface TemplateIconProps {
    icon: string;
}

export const TemplateIcon: React.VFC<TemplateIconProps> = ({ icon }) => {
    const faIcon = icon ? (icon.split("/") as FontAwesomeIconProps["icon"]) : undefined;

    return faIcon ? <FontAwesomeIcon icon={faIcon} /> : null;
};
