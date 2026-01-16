import React, { useCallback } from "react";
import type {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types.js";
import { Image } from "./entry/Image.js";
import { View } from "./entry/View.js";
import { Select } from "./entry/Select.js";
import { Remove } from "./entry/Remove.js";
import { MoveUp } from "./entry/MoveUp.js";
import { MoveDown } from "./entry/MoveDown.js";
import type { CmsModel } from "~/types.js";
import { Tag, TimeAgo, Text, Sidebar, DropdownMenu, IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVertIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as RemoveIcon } from "@webiny/icons/close.svg";

interface EntryProps {
    model: CmsModel;
    entry: CmsReferenceContentEntry;
    onChange: (value: CmsReferenceValue) => void;
    index?: never;
    selected: boolean;
    onMoveUp?: never;
    onMoveDown?: never;
    onRemove?: never;
    placement?: string;
}

interface EntryPropsWithRemove {
    onRemove: (entryId: string) => void;
    model: CmsModel;
    entry: CmsReferenceContentEntry;
    index: number;
    onMoveUp?: (index: number, toTop: boolean) => void;
    onMoveDown?: (index: number, toBottom: boolean) => void;
    onChange?: never;
    selected?: never;
    placement?: string;
}

export const Entry = ({
    model,
    entry,
    onChange,
    onRemove,
    selected,
    index,
    onMoveUp: onMoveUpClick,
    onMoveDown: onMoveDownClick,
    placement
}: EntryPropsWithRemove | EntryProps) => {
    const onMoveUp = useCallback(
        (ev: React.MouseEvent) => {
            if (!onMoveUpClick) {
                return;
            }
            onMoveUpClick(index, ev.shiftKey);
        },
        [onMoveUpClick, index]
    );
    const onMoveDown = useCallback(
        (ev: React.MouseEvent) => {
            if (!onMoveDownClick) {
                return;
            }
            onMoveDownClick(index, ev.shiftKey);
        },
        [onMoveDownClick, index]
    );

    const icon = model.icon;

    const entryStatusLabel = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
    const entryRevision = "v2";

    return (
        <div data-role="ref-field-entry" className={"w-full rounded-md bg-neutral-light"}>
            <div className="flex items-center justify-between gap-lg min-w-0 p-sm-extra pr-lg">
                <Image title={entry.title} src={entry.image} icon={icon} />
                <div
                    className={
                        "flex flex-col gap-xxs overflow-hidden flex-1 min-w-0 text-sm text-neutral-muted"
                    }
                >
                    <div>{entry.model.name}</div>

                    <div className={"text-md text-neutral-primary font-semibold mb-sm"}>
                        {entry.title}
                    </div>

                    <div>
                        <span className={"w-[60px] inline-block"}>Created:</span>
                        <span>
                            {entry.createdBy.displayName}, <TimeAgo datetime={entry.createdOn} />
                        </span>
                    </div>
                    <div>
                        <span className={"w-[60px] inline-block"}>Source:</span>
                        <span>
                            Home / Content / Preview / ... / Manage / Retail / Local / Products
                        </span>
                    </div>
                </div>
                <div className={"flex items-center gap-sm"}>
                    <Tag
                        content={
                            <>
                                {entryStatusLabel}&nbsp;
                                <Text size={"sm"} className={"text-neutral-muted"}>
                                    ({entryRevision})
                                </Text>
                            </>
                        }
                        variant={"neutral-base-outline"}
                    />
                    <DropdownMenu
                        trigger={
                            <IconButton
                                variant={"ghost"}
                                size={"sm"}
                                icon={
                                    <Sidebar.Item.Icon
                                        label="Settings"
                                        element={<MoreVertIcon />}
                                    />
                                }
                            />
                        }
                        className={"w-[225px]"}
                    >
                        <DropdownMenu.Item icon={<OpenInNewIcon />} text={"Open in new window"} />

                        {onRemove && (
                            <DropdownMenu.Item
                                icon={<RemoveIcon />}
                                text={"Remove from list"}
                                onClick={() => onRemove(entry.id)}
                            />
                        )}
                    </DropdownMenu>
                </div>
                {/*<div className={"flex items-center gap-sm pr-sm-extra h-lg"}>
                    {placement == "multiRef" && (
                        <>
                            <MoveUp
                                className={onMoveUpClick ? "active" : "disabled"}
                                onClick={onMoveUp}
                            />
                            <MoveDown
                                className={onMoveDownClick ? "active" : "disabled"}
                                onClick={onMoveDown}
                            />
                        </>
                    )}
                    <View entry={entry} />
                    {onChange && <Select entry={entry} onChange={onChange} selected={selected} />}
                    {onRemove && <Remove entry={entry} onRemove={onRemove} />}
                </div>*/}
            </div>
        </div>
    );
};
