import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, Tooltip, useToast } from "@webiny/admin-ui";
import { useFeature, useContainer } from "@webiny/app";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as PasteIcon } from "@webiny/icons/content_paste.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as CloneIcon } from "@webiny/icons/library_add.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/expand_less.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as HorizontalRuleIcon } from "@webiny/icons/horizontal_rule.svg";
import type { IObjectFieldItemVM, IObjectFieldVM } from "~/features/formModel/index.js";
import { TEMPLATE_DISCRIMINATOR } from "~/features/formModel/ObjectField.js";
import { ClipboardFeature } from "~/features/clipboard/feature.js";
import { useConfirmationDialog } from "~/hooks/useConfirmationDialog.js";
import { NestedLayout } from "../ObjectFieldComponents.js";
import { AddTemplateButton } from "../TemplatePicker.js";
import {
    MultiValueDynamicZonePresenter,
    type IMultiValueDynamicZonePresenter
} from "./abstractions.js";
import type { ISortableItemProps } from "~/presentation/sortable/index.js";
import { Separator } from "@webiny/admin-ui";

interface MultiValueDynamicZoneProps {
    field: IObjectFieldVM;
    addItemLabel: string;
    showContainer?: boolean;
}

export const MultiValueDynamicZone = observer(
    ({ field, addItemLabel, showContainer = true }: MultiValueDynamicZoneProps) => {
        const toast = useToast();
        const { clipboard } = useFeature(ClipboardFeature);
        const container = useContainer();

        const presenter = useMemo<IMultiValueDynamicZonePresenter>(() => {
            const p = container.resolve(MultiValueDynamicZonePresenter);
            p.init({ type: `dz:${field.name}`, onReorder: (from, to) => field.moveItem(from, to) });
            return p;
        }, []);

        useEffect(() => {
            return () => presenter.dispose();
        }, [presenter]);

        const itemCount = field.items.length;

        const clipboardItem = clipboard.item;
        const canPaste =
            clipboardItem !== null &&
            clipboardItem.type === "wby.dz" &&
            typeof clipboardItem.data[TEMPLATE_DISCRIMINATOR] === "string" &&
            field.availableTemplates.some(t => t.id === clipboardItem.data[TEMPLATE_DISCRIMINATOR]);

        const content = (
            <div className={"flex flex-col gap-lg"}>
                {itemCount > 0 ? (
                    <Accordion
                        background={"base"}
                        variant={"container"}
                        className={"gap-md flex flex-col"}
                    >
                        {field.items.map((item, index) => (
                            <TemplatedListItem
                                key={item.key}
                                item={item}
                                index={index}
                                total={itemCount}
                                templates={field.availableTemplates}
                                disabled={field.disabled}
                                sortable={presenter.getItemProps(index)}
                            />
                        ))}
                    </Accordion>
                ) : null}
                {!field.disabled && (
                    <div className={"flex gap-sm items-center"}>
                        <AddTemplateButton
                            label={addItemLabel}
                            templates={field.availableTemplates}
                            onSelect={template => field.addItem(template.id)}
                        />
                        {canPaste && (
                            <Button
                                size={"sm"}
                                variant={"tertiary"}
                                text={"Paste"}
                                icon={<PasteIcon />}
                                onClick={() => {
                                    const pasted = clipboard.paste();
                                    if (pasted) {
                                        field.addItem(pasted.data);
                                        toast.showSuccessToast({
                                            title: "Pasted from clipboard."
                                        });
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        );

        if (!showContainer) {
            return (
                <>
                    <Separator labelPosition={"start"} variant={"accent"}>
                        <span className={"text-accent-primary text-lg font-semibold"}>
                            {field.label ?? ""} ({itemCount})
                        </span>
                    </Separator>
                    <div className={"mt-md"}>{content}</div>
                </>
            );
        }

        const label = `${field.label || ""}${itemCount ? ` (${itemCount})` : ""}`;

        return (
            <Accordion background={"base"} variant={"container"}>
                <Accordion.Item
                    icon={
                        <Accordion.Item.Icon
                            color={"accent"}
                            label={"Dynamic Zone"}
                            icon={<HorizontalRuleIcon />}
                        />
                    }
                    title={label}
                    defaultOpen={true}
                >
                    {content}
                </Accordion.Item>
            </Accordion>
        );
    }
);

interface TemplatedListItemProps {
    item: IObjectFieldItemVM;
    index: number;
    total: number;
    templates: { id: string; label: string }[];
    disabled: boolean;
    sortable: ISortableItemProps;
}

const TemplatedListItem = observer(
    ({ item, index, total, templates, disabled, sortable }: TemplatedListItemProps) => {
        const toast = useToast();
        const { clipboard } = useFeature(ClipboardFeature);
        const { showConfirmation } = useConfirmationDialog({
            title: "Delete item",
            message: "Are you sure you want to delete this item? This action is not reversible.",
            acceptLabel: "Yes, I'm sure!",
            cancelLabel: "No, leave it."
        });

        const template = templates.find(t => t.id === item.templateId);
        const title = template?.label || `Item #${index + 1}`;

        const onDelete = () => {
            showConfirmation(() => {
                item.remove();
            });
        };

        const actions = (
            <>
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<ArrowUpIcon />} content={"Move up"} />}
                    onClick={item.moveUp}
                    disabled={index === 0}
                />
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<ArrowDownIcon />} content={"Move down"} />}
                    onClick={item.moveDown}
                    disabled={index === total - 1}
                />
                <Accordion.Item.Action.Separator />
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<CopyIcon />} content={"Copy to clipboard"} />}
                    onClick={() => {
                        clipboard.copy({ type: "wby.dz", data: item.getClonedData() });
                        toast.showSuccessToast({ title: "Copied to clipboard." });
                    }}
                />
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<CloneIcon />} content={"Duplicate"} />}
                    onClick={item.duplicate}
                />
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<DeleteIcon />} content={"Delete"} />}
                    onClick={onDelete}
                />
            </>
        );

        return (
            <div
                ref={sortable.ref}
                data-sortable-item=""
                className={"relative"}
                style={{ opacity: sortable.isDragging ? 0.4 : 1 }}
            >
                {sortable.closestEdge === "top" && (
                    <DropIndicator position={"top"} isFirst={index === 0} />
                )}
                <Accordion.Item
                    title={title}
                    actions={disabled ? null : actions}
                    defaultOpen={false}
                    draggable={!disabled}
                    dragHandleRef={sortable.handleRef}
                >
                    <NestedLayout layout={item.layout} />
                </Accordion.Item>
                {sortable.closestEdge === "bottom" && (
                    <DropIndicator position={"bottom"} isLast={index === total - 1} />
                )}
            </div>
        );
    }
);

const DropIndicator = ({
    position,
    isFirst = false,
    isLast = false
}: {
    position: "top" | "bottom";
    isFirst?: boolean;
    isLast?: boolean;
}) => {
    let offset = "calc(var(--spacing-md) / -2)";
    if (position === "top" && isFirst) {
        offset = "0px";
    }
    if (position === "bottom" && isLast) {
        offset = "0px";
    }

    return (
        <div
            className={"absolute left-0 right-0 z-10"}
            style={{
                [position]: offset,
                transform: position === "top" ? "translateY(-50%)" : "translateY(50%)"
            }}
        >
            <div className={"w-full h-[2px] bg-primary rounded-full"} />
        </div>
    );
};
