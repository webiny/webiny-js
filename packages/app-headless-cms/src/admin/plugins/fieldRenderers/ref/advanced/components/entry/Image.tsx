import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as ImageIcon } from "@webiny/icons/image.svg";

interface ImageProps {
    title: string;
    src?: string | null;
    width?: number;
}

export const Image = ({ src, width, title }: ImageProps) => {
    return (
        <div className={"size-[96px] rounded-lg overflow-hidden relative"}>
            <div className={"size-full flex justify-center items-center bg-neutral-base"}>
                {src ? (
                    <img src={src} width={width} />
                ) : (
                    <Icon
                        label={title}
                        icon={<ImageIcon />}
                        className={"w-[32px] h-[32px]"}
                        color={"neutral-light"}
                    />
                )}
            </div>
        </div>
    );
};
