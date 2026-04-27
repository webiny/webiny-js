import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as CloneIcon } from "@webiny/icons/library_add.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/expand_less.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as HorizontalRuleIcon } from "@webiny/icons/horizontal_rule.svg";
import type { IObjectFieldItemVM, IObjectFieldVM } from "~/features/formModel/index.js";
import { useConfirmationDialog } from "~/hooks/useConfirmationDialog.js";
import { NestedLayout } from "./ObjectFieldComponents.js";
import { AddTemplateButton } from "./TemplatePicker.js";

interface MultiValueDynamicZoneProps {
    field: IObjectFieldVM;
    showContainer?: boolean;
}

export const MultiValueDynamicZone = observer(
    ({ field, showContainer = true }: MultiValueDynamicZoneProps) => {
        const itemCount = field.items.length;

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
                    <AddTemplateButton
                        templates={field.availableTemplates}
                        onSelect={template => field.addItem(template.id)}
                    />
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
    templates: { id: string; name: string }[];
    disabled: boolean;
}

const TemplatedListItem = observer(
    ({ item, index, total, templates, disabled }: TemplatedListItemProps) => {
        const { showConfirmation } = useConfirmationDialog({
            title: "Delete item",
            message: "Are you sure you want to delete this item? This action is not reversible.",
            acceptLabel: "Yes, I'm sure!",
            cancelLabel: "No, leave it."
        });

        const template = templates.find(t => t.id === item.templateId);
        const title = template?.name || `Item #${index + 1}`;

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
