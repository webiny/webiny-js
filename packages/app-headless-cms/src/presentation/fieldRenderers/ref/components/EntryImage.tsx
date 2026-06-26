import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as ImageIcon } from "@webiny/icons/image.svg";

interface EntryImageProps {
    title: string;
    src?: string | null;
}

export const EntryImage = ({ src, title }: EntryImageProps) => {
    return (
        <div className={"size-[96px] rounded-lg overflow-hidden relative"}>
            <div className={"size-full flex justify-center items-center bg-neutral-base"}>
                {src ? (
                    <img src={src} />
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
