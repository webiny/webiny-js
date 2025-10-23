import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Icon } from "@webiny/admin-ui";

interface IconProps {
    icon: string | undefined;
}

interface ImageProps {
    title: string;
    src?: string | null;
    width?: number;
    icon: string | undefined;
}

const DisplayIcon = ({ icon }: IconProps) => {
    if (!icon) {
        return null;
    }
    return (
        <Icon
            icon={<FontAwesomeIcon icon={(icon || "").split("/") as IconProp} />}
            label={"Model icon"}
            size={"lg"}
            className={"text-neutral-muted"}
        />
    );
};

export const Image = ({ src, icon, width }: ImageProps) => {
    return (
        <div className={"size-[56px] m-xs rounded-sm overflow-hidden relative"}>
            <div
                className={
                    "size-full flex justify-center items-center bg-neutral-base"
                }
            >
                {src ? <img src={src} width={width} /> : <DisplayIcon icon={icon} />}
            </div>
        </div>
    );
};
