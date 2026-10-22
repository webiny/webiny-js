import React from "react";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";

import { Icon, IconButton, Tooltip, cn, type FileItemFormatted } from "@webiny/admin-ui";

interface AvatarImagePreviewProps {
    value: FileItemFormatted;
    onReplaceItem: any;
    onRemoveItem: any;
    disabled?: boolean;
}

const AvatarImagePreview = ({
    value,
    onReplaceItem,
    onRemoveItem,
    disabled
}: AvatarImagePreviewProps) => {
    return (
        <div className={"w-full flex-1"}>
            <div className={cn("size-[128px] mx-auto relative overflow-hidden")}>
                <div className={"size-full"}>
                    <img src={value.url} alt={value.name} className={"object-cover size-full"} />
                </div>
                <div
                    className={cn([
                        "flex justify-center items-center gap-xs size-full",
                        "absolute top-0 left-0",
                        "bg-neutral-xstrong/90",
                        "opacity-0 hover:opacity-100 transition-opacity"
                    ])}
                >
                    {onReplaceItem && (
                        <Tooltip
                            content={"Select another image"}
                            trigger={
                                <IconButton
                                    icon={
                                        <Icon
                                            icon={<EditIcon />}
                                            label={"Select another image"}
                                            size={"md"}
                                            color={"neutral-light"}
                                        />
                                    }
                                    variant={"ghost-negative"}
                                    size={"sm"}
                                    onClick={onReplaceItem}
                                    disabled={disabled}
                                />
                            }
                        ></Tooltip>
                    )}
                    {onRemoveItem && (
                        <Tooltip
                            content={"Remove image"}
                            trigger={
                                <IconButton
                                    icon={
                                        <Icon
                                            icon={<TrashIcon />}
                                            label={"Remove"}
                                            size={"md"}
                                            color={"neutral-light"}
                                        />
                                    }
                                    variant={"ghost-negative"}
                                    size={"sm"}
                                    onClick={onRemoveItem}
                                    disabled={disabled}
                                />
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export { AvatarImagePreview, type AvatarImagePreviewProps };
