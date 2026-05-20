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
    disabled?: boolean;
    selected: boolean;
    onMoveUp?: never;
    onMoveDown?: never;
    onRemove?: never;
    placement?: string;
}

interface EntryPropsWithRemove {
    onRemove: (entryId: string) => void;
    disabled?: boolean;
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
    placement,
    disabled = false
}: EntryPropsWithRemove | EntryProps) => {
    const { getLink } = useRouter();

    const onSelect = useCallback(() => {
        if (onChange) {
            onChange({
                id: entry.id,
                modelId: entry.model.modelId
            });
        }
    }, [onChange, entry.id, entry.model.modelId]);

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

    const folderId = entry.wbyAco_location?.folderId || entry.location?.folderId || "";

    const link = getLink(Routes.ContentEntries.List, {
        id: entry.id,
        modelId: entry.model.modelId,
        folderId
    });

    return (
        <div
            data-selected={selected}
            onClick={onSelect}
            data-role="ref-field-entry"
            className={cn(
                "flex items-center justify-between gap-md w-full rounded-md bg-neutral-light p-sm-extra pr-lg hover:bg-neutral-dimmed border-md border-transparent data-[selected=true]:border-accent-dimmed",
                { "hover:cursor-pointer": !!onChange }
            )}
        >
            {onChange && !disabled ? (
                <div>
                    <Checkbox
                        checked={selected}
                        onChange={() => {
                            // We're not calling the onSelect callback here because
                            // the parent div already does that on click.
                        }}
                    />
                </div>
            ) : null}
            <div
                className={
                    "grid grid-cols-[auto_1fr] items-start @lg:items-center gap-lg text-sm text-neutral-muted w-full min-w-0"
                }
            >
                <Image title={entry.title} src={entry.image} />
                <div
                    className={
                        "flex flex-col @lg:flex-row @lg:items-center @lg:justify-between gap-sm min-w-0"
                    }
                >
                    <div className={"min-w-0"}>
                        <div className={"truncate"}>{entry.model.name}</div>

                        <div
                            title={entry.title}
                            className={
                                "text-md text-neutral-primary font-semibold mb-sm text-ellipsis overflow-hidden whitespace-nowrap block"
                            }
                        >
                            {entry.title}
                        </div>

                        <div>
                            <span className={"w-[60px] inline-block"}>Created:</span>
                            <span>
                                {entry.createdBy.displayName},{" "}
                                <TimeAgo datetime={entry.createdOn} />
                            </span>
                        </div>
                    </div>
                    <div className={"flex items-center gap-sm shrink-0"}>
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

                        {!disabled && placement == "multiRef" ? (
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
                        ) : null}

                        {!disabled ? (
                            <DropdownMenu
                                trigger={
                                    <IconButton
                                        variant={"ghost"}
                                        size={"sm"}
                                        icon={<MoreVertIcon />}
                                    />
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
                                        text={
                                            placement === "multiRef" ? "Remove from list" : "Remove"
                                        }
                                        onClick={() => onRemove(entry.id)}
                                    />
                                )}
                            </DropdownMenu>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
