import React from "react";
import type { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TemplateIconProps {
    icon: string;
}

export const TemplateIcon = ({ icon }: TemplateIconProps) => {
    const faIcon = icon ? (icon.split("/") as FontAwesomeIconProps["icon"]) : undefined;

    return faIcon ? (
        <FontAwesomeIcon className={"text-neutral-xstrong w-[40px] h-[40px]"} icon={faIcon} />
    ) : null;
};
