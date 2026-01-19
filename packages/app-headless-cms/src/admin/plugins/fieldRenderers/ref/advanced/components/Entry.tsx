import React, { useCallback, useMemo } from "react";
import type {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types.js";
import { Image } from "./entry/Image.js";
import type { CmsModel } from "~/types.js";
import { Tag, TimeAgo, Text, DropdownMenu, IconButton, Checkbox, cn } from "@webiny/admin-ui";
import { ReactComponent as MoreVertIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as RemoveIcon } from "@webiny/icons/close.svg";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import { useRouter } from "@webiny/app";
import { Routes } from "~/routes.js";

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
    entry,
    onChange,
    onRemove,
    selected,
    index,
    onMoveUp: onMoveUpClick,
    onMoveDown: onMoveDownClick,
    placement
}: EntryPropsWithRemove | EntryProps) => {
    const { getLink } = useRouter();

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

    const entryStatusLabel = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);

    // Did not have `revision` field available in the `getLatestContentEntries`
    // response, hence the manual extraction from the `id` field.
    const entryRevision = useMemo(() => {
        const extractedRevision = entry.id.split("#")[1] || "0001";

        // Remove leading zeros for correct padding.
        return "v" + Number(extractedRevision).toString();
    }, [entry.id]);

    const folderId = entry.wbyAco_location?.folderId || "";

    const link = getLink(Routes.ContentEntries.List, {
        id: entry.id,
        modelId: entry.model.modelId,
        folderId
    });

    return (
        <div
            data-selected={selected}
            onClick={() => {
                if (onChange) {
                    onChange({
                        id: entry.id,
                        modelId: entry.model.modelId
                    });
                }
            }}
            data-role="ref-field-entry"
            className={cn(
                "w-full rounded-md bg-neutral-light hover:bg-neutral-dimmed border-md border-transparent data-[selected=true]:border-accent-dimmed",
                { "hover:cursor-pointer": !!onChange }
            )}
        >
            <div className="flex items-center justify-between gap-lg min-w-0 p-sm-extra pr-lg">
                <div>
                    {onChange && (
                        <Checkbox
                            checked={selected}
                            onChange={() =>
                                onChange({
                                    id: entry.id,
                                    modelId: entry.model.modelId
                                })
                            }
                        />
                    )}
                </div>
                <Image title={entry.title} src={entry.image} />
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
                    {/* <div>
                        <span className={"w-[60px] inline-block"}>Location:</span>
                        <span>
                            Home / Content / Preview / ... / Manage / Retail / Local / Products
                        </span>
                    </div>*/}
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

                    {placement == "multiRef" && (
                        <>
                            <div className={"flex gap-xs"}>
                                <IconButton
                                    disabled={!onMoveUpClick}
                                    variant={"ghost"}
                                    size={"sm"}
                                    icon={<ArrowUp />}
                                    onClick={onMoveUp}
                                />
                                <IconButton
                                    disabled={!onMoveDownClick}
                                    variant={"ghost"}
                                    size={"sm"}
                                    icon={<ArrowDown />}
                                    onClick={onMoveDown}
                                />
                            </div>
                        </>
                    )}

                    <DropdownMenu
                        trigger={
                            <IconButton variant={"ghost"} size={"sm"} icon={<MoreVertIcon />} />
                        }
                    >
                        <DropdownMenu.Link
                            icon={<OpenInNewIcon />}
                            text={"Open in new tab"}
                            to={link}
                            target={"_blank"}
                        />

                        {onRemove && (
                            <DropdownMenu.Item
                                icon={<RemoveIcon />}
                                text={"Remove from list"}
                                onClick={() => onRemove(entry.id)}
                            />
                        )}
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};
