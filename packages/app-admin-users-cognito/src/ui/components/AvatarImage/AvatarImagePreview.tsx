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
        <div className={"wby-w-full wby-flex-1"}>
            <div className={cn("wby-size-[128px] wby-mx-auto wby-relative wby-overflow-hidden")}>
                <div className={"wby-size-full"}>
                    <img
                        src={value.url}
                        alt={value.name}
                        className={"wby-object-cover wby-size-full"}
                    />
                </div>
                <div
                    className={cn([
                        "wby-flex wby-justify-center wby-items-center wby-gap-xs wby-size-full",
                        "wby-absolute wby-top-0 wby-left-0",
                        "wby-bg-neutral-xstrong/90",
                        "wby-opacity-0 hover:wby-opacity-100 wby-transition-opacity"
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
