import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, Tooltip, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
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
import { NestedLayout } from "./ObjectFieldComponents.js";
import { AddTemplateButton } from "./TemplatePicker.js";

interface MultiValueDynamicZoneProps {
    field: IObjectFieldVM;
    showContainer?: boolean;
}

export const MultiValueDynamicZone = observer(
    ({ field, showContainer = true }: MultiValueDynamicZoneProps) => {
        const toast = useToast();
        const { clipboard } = useFeature(ClipboardFeature);
        const itemCount = field.items.length;

        const clipboardItem = clipboard.item;
        const canPaste =
            clipboardItem !== null &&
            clipboardItem.type === "wby.dz" &&
            typeof clipboardItem.data[TEMPLATE_DISCRIMINATOR] === "string" &&
            field.availableTemplates.some(
                t => t.id === clipboardItem.data[TEMPLATE_DISCRIMINATOR]
            );

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
                            />
                        ))}
                    </Accordion>
                ) : null}
                {!field.disabled && (
                    <div className={"flex gap-sm items-center"}>
                        <AddTemplateButton
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
            return content;
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
}

const TemplatedListItem = observer(
    ({ item, index, total, templates, disabled }: TemplatedListItemProps) => {
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
            <Accordion.Item title={title} actions={disabled ? null : actions} defaultOpen={false}>
                <NestedLayout layout={item.layout} />
            </Accordion.Item>
        );
    }
);
